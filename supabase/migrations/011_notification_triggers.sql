-- ─────────────────────────────────────────────────────────────────────────────
-- 011_notification_triggers.sql
--
-- Automatically create notifications when a user is followed or their
-- content is liked.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Follow Notifications
CREATE OR REPLACE FUNCTION handle_new_follower()
RETURNS trigger AS $$
BEGIN
  -- Don't notify if following oneself (though UI shouldn't allow this)
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_follower
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION handle_new_follower();

-- 2. Reading List Likes Notifications
CREATE OR REPLACE FUNCTION handle_reading_list_like()
RETURNS trigger AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Get the owner of the reading list
  SELECT user_id INTO v_owner_id FROM reading_lists WHERE id = NEW.reading_list_id;
  
  -- Don't notify if liking own list
  IF v_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, target_id)
    VALUES (v_owner_id, NEW.user_id, 'like_playlist', NEW.reading_list_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_reading_list_like
  AFTER INSERT ON reading_list_likes
  FOR EACH ROW EXECUTE FUNCTION handle_reading_list_like();

-- 3. Favorite Book Likes Notifications
CREATE OR REPLACE FUNCTION handle_favorite_book_like()
RETURNS trigger AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Get the owner of the favorite book entry
  SELECT user_id INTO v_owner_id FROM favorite_books WHERE id = NEW.favorite_book_id;
  
  -- Don't notify if liking own favorite
  IF v_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, target_id)
    VALUES (v_owner_id, NEW.user_id, 'like_favorite', NEW.favorite_book_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_favorite_book_like
  AFTER INSERT ON favorite_book_likes
  FOR EACH ROW EXECUTE FUNCTION handle_favorite_book_like();
