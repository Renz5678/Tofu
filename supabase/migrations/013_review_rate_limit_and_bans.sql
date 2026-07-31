-- ─────────────────────────────────────────────────────────────────────────────
-- 013_review_rate_limit_and_bans.sql
--
-- Adds progressive banning for users who spam reviews (e.g. >= 5 per minute).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add tracking columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS review_ban_until timestamptz,
ADD COLUMN IF NOT EXISTS review_offense_count int NOT NULL DEFAULT 0;

-- 2. Update RLS on reviews table to check ban status
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      SELECT coalesce(review_ban_until, '1970-01-01'::timestamptz) 
      FROM profiles WHERE id = auth.uid()
    ) < now()
  );

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE TO authenticated 
  USING (
    auth.uid() = user_id
    AND (
      SELECT coalesce(review_ban_until, '1970-01-01'::timestamptz) 
      FROM profiles WHERE id = auth.uid()
    ) < now()
  );

-- 3. Create the rate-limit trigger function
CREATE OR REPLACE FUNCTION check_review_rate_limit()
RETURNS trigger AS $$
DECLARE
  v_ban_until timestamptz;
  v_offense_count int;
  v_recent_reviews_count int;
BEGIN
  -- Fetch current ban status
  SELECT review_ban_until, review_offense_count 
  INTO v_ban_until, v_offense_count
  FROM profiles 
  WHERE id = NEW.user_id;

  -- Check 1: Already Banned (this is a fallback in case RLS didn't catch it, or if called by a superuser)
  IF v_ban_until IS NOT NULL AND v_ban_until > now() THEN
    -- Silently drop the insert/update
    RETURN NULL;
  END IF;

  -- Check 2: Rate Limit (Count distinct reviews touched in the last 1 minute)
  SELECT count(*)
  INTO v_recent_reviews_count
  FROM reviews
  WHERE user_id = NEW.user_id 
    AND updated_at > (now() - interval '1 minute');

  -- Threshold is 5 reviews per minute. If they are inserting their 6th, ban them.
  IF v_recent_reviews_count >= 5 THEN
    -- Calculate new ban duration based on offense count
    IF v_offense_count = 0 THEN
      v_ban_until := now() + interval '1 day';
    ELSIF v_offense_count = 1 THEN
      v_ban_until := now() + interval '1 week';
    ELSE
      v_ban_until := now() + interval '1 month';
    END IF;
    
    -- Increment offense count
    v_offense_count := v_offense_count + 1;

    -- Update profile with new ban info
    UPDATE profiles 
    SET review_ban_until = v_ban_until,
        review_offense_count = v_offense_count
    WHERE id = NEW.user_id;

    -- Silently drop the insert/update that triggered the ban
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to reviews
DROP TRIGGER IF EXISTS enforce_review_rate_limit ON reviews;
CREATE TRIGGER enforce_review_rate_limit
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_review_rate_limit();
