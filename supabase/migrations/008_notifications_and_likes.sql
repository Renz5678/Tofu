-- ─────────────────────────────────────────────
-- reading_list_likes
-- ─────────────────────────────────────────────
create table if not exists reading_list_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  reading_list_id uuid not null references reading_lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, reading_list_id)
);

alter table reading_list_likes enable row level security;
create policy "reading_list_likes_select_all" on reading_list_likes for select using (true);
create policy "reading_list_likes_owner_all" on reading_list_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- favorite_book_likes
-- ─────────────────────────────────────────────
create table if not exists favorite_book_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  favorite_book_id uuid not null references favorite_books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, favorite_book_id)
);

alter table favorite_book_likes enable row level security;
create policy "favorite_book_likes_select_all" on favorite_book_likes for select using (true);
create policy "favorite_book_likes_owner_all" on favorite_book_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
create type notification_type as enum ('follow', 'like_playlist', 'like_favorite');

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade, -- receiver
  actor_id uuid not null references profiles(id) on delete cascade, -- sender
  type notification_type not null,
  target_id uuid, -- could be reading_list_id, favorite_book_id, etc.
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "notifications_owner_all" on notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- pg_cron auto-delete notifications
-- ─────────────────────────────────────────────
create extension if not exists pg_cron;

DO $$ 
BEGIN
  PERFORM cron.unschedule('delete-old-notifications');
EXCEPTION WHEN OTHERS THEN
  -- ignore if it doesn't exist
END $$;

select cron.schedule(
  'delete-old-notifications',
  '0 0 * * *',
  $$
    DELETE FROM notifications 
    WHERE (is_read = true AND created_at < NOW() - INTERVAL '7 days')
       OR (is_read = false AND created_at < NOW() - INTERVAL '30 days');
  $$
);
