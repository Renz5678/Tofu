-- TEST SCRIPT: Run this in the Supabase SQL Editor

DO $$ 
DECLARE
  v_dummy_user_id uuid := gen_random_uuid();
  v_book_id uuid;
  i int;
BEGIN
  -- 1. Create a dummy user bypassing Auth directly in the profiles table
  -- (Normally users come from auth.users, but for a quick DB test we can insert a profile if foreign keys allow it,
  -- wait, profiles has a foreign key to auth.users! We must insert into auth.users first)
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (v_dummy_user_id, 'test_spammer_' || extract(epoch from now()) || '@example.com', '{"username":"test_spammer"}');
  
  -- The trigger `handle_new_user` will automatically create the profile!
  
  -- 2. Create 6 dummy books and insert reviews for them
  FOR i IN 1..6 LOOP
    INSERT INTO books (open_library_id, title)
    VALUES ('test_ol_' || extract(epoch from now()) || '_' || i, 'Dummy Book ' || i)
    RETURNING id INTO v_book_id;
    
    -- Try to insert a review. 
    -- The 6th review should be silently dropped by our rate limit trigger.
    INSERT INTO reviews (user_id, book_id, rating, content)
    VALUES (v_dummy_user_id, v_book_id, 5, 'Spam review ' || i);
    
    RAISE NOTICE 'Attempted to insert review %', i;
  END LOOP;
  
END $$;

-- 3. Check the results
SELECT 
  username, 
  review_ban_until, 
  review_offense_count 
FROM profiles 
WHERE username = 'test_spammer';

-- 4. Count how many reviews were actually saved (should be 5, not 6)
SELECT count(*) as saved_reviews_count
FROM reviews r
JOIN profiles p ON p.id = r.user_id
WHERE p.username = 'test_spammer';
