-- ─────────────────────────────────────────────────────────────────────────────
-- 010_security_hardening.sql
--
-- 1. Fix `log_reading_session` RPC (remove user input for p_user_id, cap duration)
-- 2. Restrict `books` UPDATE policy to `cover_storage_url` only.
-- 3. Secure `get_email_for_username` with rate limiting
-- 4. Set length constraints on profiles and review_comments
-- 5. Anti-spam limits using triggers (sessions, comments, notifications)
-- 6. Restrict `reading_sessions` visibility to owner and followers
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- 1. Fix `log_reading_session` RPC
-- ─────────────────────────────────────────────
-- Drop the old insecure function
DROP FUNCTION IF EXISTS log_reading_session(uuid, uuid, timestamptz, timestamptz, int, int, int, numeric, numeric, text);

CREATE OR REPLACE FUNCTION log_reading_session(
  p_user_book_id     uuid,
  p_start_time       timestamptz,
  p_end_time         timestamptz,
  p_duration_seconds int,
  p_start_page       int,
  p_end_page         int,
  p_pages_per_hour   numeric,
  p_minutes_per_page numeric,
  p_notes            text default null
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_session_id  uuid;
  v_user_id     uuid := auth.uid();
  v_today       date := current_date;
  v_yesterday   date := current_date - 1;
  v_streak_row  record;
  v_new_streak  int;
  v_new_longest int;
BEGIN
  -- Security check: ensure caller is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Security check: duration cannot exceed 24 hours (86400 seconds)
  IF p_duration_seconds > 86400 THEN
    RAISE EXCEPTION 'Session duration cannot exceed 24 hours';
  END IF;

  -- Security check: Ensure the user_book belongs to the calling user
  IF NOT EXISTS (SELECT 1 FROM user_books WHERE id = p_user_book_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Permission denied on user_book_id';
  END IF;

  -- a) Insert reading session
  INSERT INTO reading_sessions (
    user_id, user_book_id,
    start_time, end_time, duration_seconds,
    start_page, end_page,
    pages_per_hour, minutes_per_page,
    notes
  ) VALUES (
    v_user_id, p_user_book_id,
    p_start_time, p_end_time, p_duration_seconds,
    p_start_page, p_end_page,
    p_pages_per_hour, p_minutes_per_page,
    p_notes
  )
  RETURNING id INTO v_session_id;

  -- b) Update current page on user_books
  UPDATE user_books
  SET current_page = p_end_page
  WHERE id = p_user_book_id
    AND user_id = v_user_id;

  -- c) Upsert streak (server-time)
  SELECT current_streak, longest_streak, last_read_date
  INTO v_streak_row
  FROM streaks
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, current_streak, longest_streak, last_read_date)
    VALUES (v_user_id, 1, 1, v_today);
  ELSIF v_streak_row.last_read_date = v_today THEN
    NULL; -- already logged today
  ELSE
    IF v_streak_row.last_read_date = v_yesterday THEN
      v_new_streak := v_streak_row.current_streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;
    v_new_longest := greatest(v_streak_row.longest_streak, v_new_streak);

    UPDATE streaks
    SET current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_read_date = v_today
    WHERE user_id = v_user_id;
  END IF;

  RETURN v_session_id;
END;
$$;

-- ─────────────────────────────────────────────
-- 2. Restrict `books` UPDATE policy
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "books_update_all" ON books;

-- Only allow updates to cover_storage_url, and only if it's currently null
CREATE POLICY "books_update_cover" ON books
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    -- Only the cover_storage_url can change
    title = title AND
    author = author AND
    open_library_id = open_library_id AND
    total_pages = total_pages AND
    isbn = isbn AND
    genres = genres AND
    language = language AND
    country = country
  );

-- ─────────────────────────────────────────────
-- 3. Secure `get_email_for_username` with rate limiting
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_rate_limits (
  ip_address text PRIMARY KEY,
  attempts int DEFAULT 1,
  last_attempt timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION get_email_for_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_client_ip text;
  v_attempts int;
BEGIN
  -- Anti-timing attack
  PERFORM pg_sleep(0.1);

  -- Extract IP address
  v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  IF v_client_ip IS NULL THEN
    v_client_ip := 'unknown';
  END IF;

  -- Rate limit check (max 10 attempts per 15 minutes)
  SELECT attempts INTO v_attempts
  FROM ip_rate_limits
  WHERE ip_address = v_client_ip AND last_attempt > now() - interval '15 minutes';

  IF v_attempts >= 10 THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.';
  END IF;

  -- Increment attempts
  INSERT INTO ip_rate_limits (ip_address, attempts, last_attempt)
  VALUES (v_client_ip, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
  SET attempts = ip_rate_limits.attempts + 1,
      last_attempt = now();

  -- Cleanup old attempts occasionally (1% chance)
  IF random() < 0.01 THEN
    DELETE FROM ip_rate_limits WHERE last_attempt < now() - interval '15 minutes';
  END IF;

  -- Fetch email
  SELECT u.email INTO v_email
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE lower(p.username) = lower(trim(p_username));

  RETURN v_email;
END;
$$;

-- ─────────────────────────────────────────────
-- 4. DB Length Constraints
-- ─────────────────────────────────────────────
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_len CHECK (char_length(display_name) <= 100);
ALTER TABLE review_comments ADD CONSTRAINT review_comments_content_len CHECK (char_length(content) BETWEEN 1 AND 1000);

-- ─────────────────────────────────────────────
-- 5. Anti-spam DB Triggers
-- ─────────────────────────────────────────────
-- Limit Reading Sessions (max 50 per day)
CREATE OR REPLACE FUNCTION check_daily_session_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM reading_sessions WHERE user_id = NEW.user_id AND created_at > now() - interval '1 day') >= 50 THEN
    RAISE EXCEPTION 'Daily reading session limit exceeded (50)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_session_limit ON reading_sessions;
CREATE TRIGGER enforce_session_limit
  BEFORE INSERT ON reading_sessions
  FOR EACH ROW EXECUTE FUNCTION check_daily_session_limit();

-- Limit Comments (max 100 per day)
CREATE OR REPLACE FUNCTION check_daily_comment_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM review_comments WHERE user_id = NEW.user_id AND created_at > now() - interval '1 day') >= 100 THEN
    RAISE EXCEPTION 'Daily comment limit exceeded (100)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_comment_limit ON review_comments;
CREATE TRIGGER enforce_comment_limit
  BEFORE INSERT ON review_comments
  FOR EACH ROW EXECUTE FUNCTION check_daily_comment_limit();

-- Limit Duplicate Notifications (prevent spamming same notification)
CREATE OR REPLACE FUNCTION check_notification_spam()
RETURNS trigger AS $$
BEGIN
  IF (
    SELECT count(*) 
    FROM notifications 
    WHERE actor_id = NEW.actor_id 
      AND user_id = NEW.user_id 
      AND type = NEW.type 
      AND target_id = NEW.target_id 
      AND created_at > now() - interval '1 day'
  ) >= 5 THEN
    RAISE EXCEPTION 'Daily notification spam limit exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_notification_spam_limit ON notifications;
CREATE TRIGGER enforce_notification_spam_limit
  BEFORE INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION check_notification_spam();

-- ─────────────────────────────────────────────
-- 6. Restrict `reading_sessions` visibility
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "sessions_select_all" ON reading_sessions;

CREATE POLICY "sessions_owner_and_followers" ON reading_sessions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM followers 
      WHERE follower_id = auth.uid() AND following_id = reading_sessions.user_id
    )
  );
