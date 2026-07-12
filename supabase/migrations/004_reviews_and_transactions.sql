-- ─────────────────────────────────────────────────────────────────────────────
-- 004_reviews_and_transactions.sql
--
-- 1. Dedicated `reviews` table (decoupled from user_books)
-- 2. `review_likes` table for community upvoting
-- 3. Data migration — copy existing rating/review from user_books → reviews
-- 4. Drop rating/review columns from user_books
-- 5. Refresh `book_stats` view to query the new reviews table
-- 6. Atomic `log_reading_session` RPC (insert session + update page + streak)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- 1. reviews
-- ─────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  -- Rating stored as half-star precision: 0.5–5.0 in 0.5 increments
  rating numeric check (rating >= 0.5 and rating <= 5.0 and rating * 2 = floor(rating * 2)),
  liked boolean not null default false,
  content text,
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per user per book (same Letterboxd model — re-reads update this row)
  unique (user_id, book_id)
);

alter table reviews enable row level security;

-- Everyone can read reviews (community feature)
create policy "reviews_select_all" on reviews
  for select to authenticated using (true);

-- You can insert a review as yourself
create policy "reviews_insert_own" on reviews
  for insert to authenticated with check (auth.uid() = user_id);

-- You can update your own review
create policy "reviews_update_own" on reviews
  for update to authenticated using (auth.uid() = user_id);

-- You can delete your own review
create policy "reviews_delete_own" on reviews
  for delete to authenticated using (auth.uid() = user_id);

-- Auto-update updated_at on every write
create or replace function update_reviews_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reviews_updated_at_trigger
  before update on reviews
  for each row execute function update_reviews_updated_at();

-- Re-point review_comments FK to the new reviews table
alter table review_comments
  drop constraint if exists review_comments_review_id_fkey,
  add constraint review_comments_review_id_fkey
    foreign key (review_id) references reviews(id) on delete cascade;

-- ─────────────────────────────────────────────
-- 2. review_likes
-- ─────────────────────────────────────────────
create table if not exists review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

alter table review_likes enable row level security;

create policy "review_likes_select_all" on review_likes
  for select to authenticated using (true);

create policy "review_likes_insert_own" on review_likes
  for insert to authenticated with check (auth.uid() = user_id);

create policy "review_likes_delete_own" on review_likes
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. Data migration — user_books → reviews
-- ─────────────────────────────────────────────
insert into reviews (user_id, book_id, rating, content, created_at, updated_at)
select
  ub.user_id,
  ub.book_id,
  ub.rating::numeric,
  ub.review,
  coalesce(ub.finished_at, ub.added_at),
  coalesce(ub.finished_at, ub.added_at)
from user_books ub
where ub.rating is not null or ub.review is not null
on conflict (user_id, book_id) do nothing;

-- ─────────────────────────────────────────────
-- 4. Drop rating / review from user_books
-- ─────────────────────────────────────────────
-- The old book_stats view (from migration 003) depends on user_books.rating.
-- Drop it first so the ALTER TABLE below succeeds, then recreate it below.
drop view if exists book_stats cascade;

alter table user_books
  drop column if exists rating,
  drop column if exists review;

-- ─────────────────────────────────────────────
-- 5. Recreate book_stats view from reviews table
-- ─────────────────────────────────────────────
create or replace view book_stats as
select
  r.book_id,
  round(avg(r.rating)::numeric, 1) as average_rating,
  count(r.rating)                  as ratings_count,
  count(r.content)                 as reviews_count,
  count(rl.id)                     as likes_count
from reviews r
left join review_likes rl on rl.review_id = r.id
group by r.book_id;

-- ─────────────────────────────────────────────
-- 6. Atomic log_reading_session RPC
-- ─────────────────────────────────────────────
create or replace function log_reading_session(
  p_user_id          uuid,
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
returns uuid
language plpgsql security definer
as $$
declare
  v_session_id  uuid;
  v_today       date := current_date;
  v_yesterday   date := current_date - 1;
  v_streak_row  record;
  v_new_streak  int;
  v_new_longest int;
begin
  -- a) Insert reading session
  insert into reading_sessions (
    user_id, user_book_id,
    start_time, end_time, duration_seconds,
    start_page, end_page,
    pages_per_hour, minutes_per_page,
    notes
  ) values (
    p_user_id, p_user_book_id,
    p_start_time, p_end_time, p_duration_seconds,
    p_start_page, p_end_page,
    p_pages_per_hour, p_minutes_per_page,
    p_notes
  )
  returning id into v_session_id;

  -- b) Update current page on user_books
  update user_books
  set current_page = p_end_page
  where id = p_user_book_id
    and user_id = p_user_id;

  -- c) Upsert streak (server-time — immune to client clock drift)
  select current_streak, longest_streak, last_read_date
  into v_streak_row
  from streaks
  where user_id = p_user_id;

  if not found then
    insert into streaks (user_id, current_streak, longest_streak, last_read_date)
    values (p_user_id, 1, 1, v_today);
  elsif v_streak_row.last_read_date = v_today then
    null; -- already logged today
  else
    if v_streak_row.last_read_date = v_yesterday then
      v_new_streak := v_streak_row.current_streak + 1;
    else
      v_new_streak := 1;
    end if;
    v_new_longest := greatest(v_streak_row.longest_streak, v_new_streak);

    update streaks
    set current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_read_date = v_today
    where user_id = p_user_id;
  end if;

  return v_session_id;
end;
$$;
