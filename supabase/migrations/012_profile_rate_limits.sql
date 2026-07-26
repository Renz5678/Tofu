-- ─────────────────────────────────────────────────────────────────────────────
-- 012_profile_rate_limits.sql
--
-- Adds columns and a BEFORE UPDATE trigger to the `profiles` table to limit
-- changes to `username` and `display_name` to once every 30 days.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add tracking columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username_last_changed timestamptz,
ADD COLUMN IF NOT EXISTS display_name_last_changed timestamptz;

-- 2. Create the rate-limit trigger function
CREATE OR REPLACE FUNCTION enforce_profile_rate_limits()
RETURNS trigger AS $$
BEGIN
  -- Username change check
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF OLD.username_last_changed IS NOT NULL AND OLD.username_last_changed > (now() - interval '30 days') THEN
      RAISE EXCEPTION 'You can only change your username once every 30 days.';
    END IF;
    NEW.username_last_changed = now();
  END IF;

  -- Display Name change check
  IF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
    IF OLD.display_name_last_changed IS NOT NULL AND OLD.display_name_last_changed > (now() - interval '30 days') THEN
      RAISE EXCEPTION 'You can only change your display name once every 30 days.';
    END IF;
    NEW.display_name_last_changed = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to profiles
DROP TRIGGER IF EXISTS check_profile_rate_limits ON profiles;
CREATE TRIGGER check_profile_rate_limits
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_profile_rate_limits();
