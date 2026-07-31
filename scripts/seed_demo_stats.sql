-- scripts/seed_demo_stats.sql
-- Run this in your Supabase SQL Editor to seed the demo stats data
-- IMPORTANT: Sign up in the app first before running this script!

DO $$
DECLARE
  v_uid UUID;
  v_book_ids UUID[] := '{}';
  v_bid UUID;
  v_list_1 UUID;
  v_list_2 UUID;
  v_tier_list UUID;
  i INT;
BEGIN
  -- 1. Find the target user
  SELECT id INTO v_uid FROM auth.users WHERE email = 'lawrenzgarcia1202@gmail.com' LIMIT 1;
  
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'User lawrenzgarcia1202@gmail.com not found in auth.users!';
  END IF;



  -- 2. Seed 20 Books
  -- Insert into books and use a temporary table or just select them back
  INSERT INTO books (open_library_id, title, author, cover_url, total_pages)
  VALUES 
    ('OL101W', 'The Great Gatsby', 'F. Scott Fitzgerald', 'https://covers.openlibrary.org/b/id/8259431-L.jpg', 180),
    ('OL102W', '1984', 'George Orwell', 'https://covers.openlibrary.org/b/id/8226191-L.jpg', 328),
    ('OL103W', 'To Kill a Mockingbird', 'Harper Lee', 'https://covers.openlibrary.org/b/id/8225261-L.jpg', 281),
    ('OL104W', 'Pride and Prejudice', 'Jane Austen', 'https://covers.openlibrary.org/b/id/8228381-L.jpg', 279),
    ('OL105W', 'The Catcher in the Rye', 'J.D. Salinger', 'https://covers.openlibrary.org/b/id/8228891-L.jpg', 277),
    ('OL106W', 'Dune', 'Frank Herbert', 'https://covers.openlibrary.org/b/id/8226061-L.jpg', 412),
    ('OL107W', 'The Hobbit', 'J.R.R. Tolkien', 'https://covers.openlibrary.org/b/id/8227971-L.jpg', 310),
    ('OL108W', 'Fahrenheit 451', 'Ray Bradbury', 'https://covers.openlibrary.org/b/id/8226591-L.jpg', 249),
    ('OL109W', 'The Lord of the Rings', 'J.R.R. Tolkien', 'https://covers.openlibrary.org/b/id/8227972-L.jpg', 1178),
    ('OL110W', 'Brave New World', 'Aldous Huxley', 'https://covers.openlibrary.org/b/id/8225431-L.jpg', 268),
    ('OL111W', 'Animal Farm', 'George Orwell', 'https://covers.openlibrary.org/b/id/8226192-L.jpg', 112),
    ('OL112W', 'The Hitchhiker''s Guide to the Galaxy', 'Douglas Adams', 'https://covers.openlibrary.org/b/id/8228181-L.jpg', 193),
    ('OL113W', 'Catch-22', 'Joseph Heller', 'https://covers.openlibrary.org/b/id/8226681-L.jpg', 453),
    ('OL114W', 'The Alchemist', 'Paulo Coelho', 'https://covers.openlibrary.org/b/id/8225571-L.jpg', 163),
    ('OL115W', 'One Hundred Years of Solitude', 'Gabriel García Márquez', 'https://covers.openlibrary.org/b/id/8226991-L.jpg', 417),
    ('OL116W', 'The Chronicles of Narnia', 'C.S. Lewis', 'https://covers.openlibrary.org/b/id/8227281-L.jpg', 767),
    ('OL117W', 'The Kite Runner', 'Khaled Hosseini', 'https://covers.openlibrary.org/b/id/8225691-L.jpg', 371),
    ('OL118W', 'A Game of Thrones', 'George R.R. Martin', 'https://covers.openlibrary.org/b/id/8228511-L.jpg', 694),
    ('OL119W', 'Ender''s Game', 'Orson Scott Card', 'https://covers.openlibrary.org/b/id/8227091-L.jpg', 324),
    ('OL120W', 'The Martian', 'Andy Weir', 'https://covers.openlibrary.org/b/id/8228301-L.jpg', 369)
  ON CONFLICT (open_library_id) DO UPDATE SET title = EXCLUDED.title;

  -- Read the book IDs into an array in a deterministic order
  FOR v_bid IN 
    SELECT id FROM books 
    WHERE open_library_id IN ('OL101W','OL102W','OL103W','OL104W','OL105W','OL106W','OL107W','OL108W','OL109W','OL110W','OL111W','OL112W','OL113W','OL114W','OL115W','OL116W','OL117W','OL118W','OL119W','OL120W')
    ORDER BY open_library_id
  LOOP
    v_book_ids := array_append(v_book_ids, v_bid);
  END LOOP;

  -- 3. Add them to John Doe's library (user_books)
  -- 10 finished, 5 reading, 5 on hold
  FOR i IN 1..20 LOOP
    INSERT INTO user_books (user_id, book_id, status, current_page, added_at)
    VALUES (
      v_uid, 
      v_book_ids[i], 
      CASE 
        WHEN i <= 10 THEN 'finished'::book_status 
        WHEN i <= 15 THEN 'reading'::book_status 
        ELSE 'on_hold'::book_status 
      END,
      CASE WHEN i <= 10 THEN 200 ELSE floor(random()*100)::int END,
      now() - (random() * interval '60 days')
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- 4. Top 10 Favorites
  FOR i IN 1..10 LOOP
    INSERT INTO favorite_books (user_id, book_id, rank)
    VALUES (v_uid, v_book_ids[i], i)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 5. Playlists (Reading Lists)
  -- Playlist 1: Sci-Fi Classics
  INSERT INTO reading_lists (user_id, title, description, is_public)
  VALUES (v_uid, 'Sci-Fi Classics', 'The best of science fiction', true)
  RETURNING id INTO v_list_1;

  INSERT INTO reading_list_items (reading_list_id, book_id, position)
  VALUES 
    (v_list_1, v_book_ids[6], 1), -- Dune
    (v_list_1, v_book_ids[8], 2), -- Fahrenheit 451
    (v_list_1, v_book_ids[12], 3), -- Hitchhiker's
    (v_list_1, v_book_ids[19], 4), -- Ender's Game
    (v_list_1, v_book_ids[20], 5); -- The Martian

  -- Playlist 2: High Fantasy
  INSERT INTO reading_lists (user_id, title, description, is_public)
  VALUES (v_uid, 'High Fantasy', 'Epic journeys and magic', true)
  RETURNING id INTO v_list_2;

  INSERT INTO reading_list_items (reading_list_id, book_id, position)
  VALUES 
    (v_list_2, v_book_ids[7], 1), -- The Hobbit
    (v_list_2, v_book_ids[9], 2), -- Lord of the Rings
    (v_list_2, v_book_ids[16], 3), -- Narnia
    (v_list_2, v_book_ids[18], 4); -- Game of Thrones

  -- 6. Tier Lists
  INSERT INTO tier_lists (user_id, title, tiers)
  VALUES (v_uid, 'All-time Favorites Ranked', '["S", "A", "B", "C", "D"]')
  RETURNING id INTO v_tier_list;

  INSERT INTO tier_list_items (tier_list_id, book_id, tier, position)
  VALUES 
    (v_tier_list, v_book_ids[1], 'S', 1),
    (v_tier_list, v_book_ids[2], 'S', 2),
    (v_tier_list, v_book_ids[3], 'A', 1),
    (v_tier_list, v_book_ids[4], 'A', 2),
    (v_tier_list, v_book_ids[5], 'B', 1),
    (v_tier_list, v_book_ids[6], 'S', 3),
    (v_tier_list, v_book_ids[7], 'A', 3),
    (v_tier_list, v_book_ids[8], 'C', 1),
    (v_tier_list, v_book_ids[9], 'S', 4),
    (v_tier_list, v_book_ids[10], 'B', 2),
    (v_tier_list, v_book_ids[11], 'C', 2),
    (v_tier_list, v_book_ids[12], 'S', 5),
    (v_tier_list, v_book_ids[13], 'B', 3),
    (v_tier_list, v_book_ids[14], 'C', 3),
    (v_tier_list, v_book_ids[15], 'A', 4),
    (v_tier_list, v_book_ids[16], 'B', 4),
    (v_tier_list, v_book_ids[17], 'A', 5),
    (v_tier_list, v_book_ids[18], 'S', 6),
    (v_tier_list, v_book_ids[19], 'A', 6),
    (v_tier_list, v_book_ids[20], 'B', 5);
    
  -- 7. Add reviews and ratings so book stats populate for John Doe
  FOR i IN 1..20 LOOP
    INSERT INTO reviews (user_id, book_id, rating, liked, content)
    VALUES (
      v_uid, 
      v_book_ids[i], 
      CASE 
        WHEN i IN (1,2,6,9) THEN 5.0 
        WHEN i IN (3,4,7) THEN 4.5
        WHEN i IN (5,10) THEN 4.0
        ELSE 3.5 
      END,
      true,
      'A great read, highly recommend.'
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- 8. Add reading sessions so reading stats and charts populate
  FOR i IN 1..30 LOOP
    INSERT INTO reading_sessions (
      user_id, 
      user_book_id, 
      start_time, 
      end_time, 
      duration_seconds, 
      start_page, 
      end_page,
      pages_per_hour,
      minutes_per_page
    )
    SELECT
      v_uid,
      id as user_book_id,
      now() - ((i - 1) * interval '1 day') - interval '1 hour', -- i=1 is today
      now() - ((i - 1) * interval '1 day'),
      3600, -- 60 minutes read
      (i * 20) % 200, -- random looking start page
      ((i * 20) % 200) + 30, -- read 30 pages
      30.0, -- pages per hour (30 pages in 3600 seconds)
      2.0 -- minutes per page (60 mins / 30 pages)
    FROM user_books 
    WHERE user_id = v_uid 
    LIMIT 1 OFFSET (i % 5);
  END LOOP;

  -- 9. Add Reading Goals
  INSERT INTO reading_goals (user_id, goal_type, target_value, active)
  VALUES 
    (v_uid, 'pages_per_day', 50, true),
    (v_uid, 'minutes_per_day', 60, true);

  -- 10. Setup impressive streak stats
  UPDATE streaks
  SET current_streak = 30, longest_streak = 104, last_read_date = current_date
  WHERE user_id = v_uid;

END $$;
