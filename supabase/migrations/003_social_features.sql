-- ─────────────────────────────────────────────
-- Followers Table
-- ─────────────────────────────────────────────
create table if not exists followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

alter table followers enable row level security;

-- Everyone can read who follows who
create policy "followers_select_all" on followers
  for select to authenticated using (true);

-- You can only follow someone as yourself
create policy "followers_insert_own" on followers
  for insert to authenticated with check (auth.uid() = follower_id);

-- You can only unfollow someone as yourself
create policy "followers_delete_own" on followers
  for delete to authenticated using (auth.uid() = follower_id);

-- ─────────────────────────────────────────────
-- Review Comments Table
-- ─────────────────────────────────────────────
create table if not exists review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references user_books(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table review_comments enable row level security;

-- Everyone can read comments
create policy "comments_select_all" on review_comments
  for select to authenticated using (true);

-- You can insert a comment as yourself
create policy "comments_insert_own" on review_comments
  for insert to authenticated with check (auth.uid() = user_id);

-- You can delete your own comments
create policy "comments_delete_own" on review_comments
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Book Stats View
-- ─────────────────────────────────────────────
create or replace view book_stats as
select 
  book_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(rating) as ratings_count,
  count(review) as reviews_count
from user_books
where rating is not null or review is not null
group by book_id;

-- ─────────────────────────────────────────────
-- RLS Policy Updates for Public Profiles
-- ─────────────────────────────────────────────

-- Profiles: Allow reading all profiles
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_all" on profiles
  for select to authenticated using (true);

-- User Books: Allow reading all user_books
drop policy if exists "user_books_select_all" on user_books;
create policy "user_books_select_all" on user_books
  for select to authenticated using (true);

-- Favorite Books: Allow reading all favorite_books
drop policy if exists "favorites_select_all" on favorite_books;
create policy "favorites_select_all" on favorite_books
  for select to authenticated using (true);

-- Reading Lists: Allow reading lists if they are public OR owned by the user
drop policy if exists "reading_lists_select_all" on reading_lists;
create policy "reading_lists_select_all" on reading_lists
  for select to authenticated using (is_public = true or auth.uid() = user_id);

-- Reading List Items: Allow reading items if the list is readable
drop policy if exists "reading_list_items_select_all" on reading_list_items;
create policy "reading_list_items_select_all" on reading_list_items
  for select to authenticated using (
    exists (
      select 1 from reading_lists r 
      where r.id = reading_list_id and (r.is_public = true or r.user_id = auth.uid())
    )
  );

-- Reading Sessions: Allow reading sessions of others (for activity feed)
drop policy if exists "sessions_select_all" on reading_sessions;
create policy "sessions_select_all" on reading_sessions
  for select to authenticated using (true);
