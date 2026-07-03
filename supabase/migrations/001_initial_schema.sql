-- Tofu — Full Schema Migration
-- Run this in the Supabase SQL Editor for your project
-- All tables have RLS enabled with owner-only policies

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────────
-- books (shared reference table)
-- ─────────────────────────────────────────────
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  google_books_id text unique not null,
  title text not null,
  author text,
  cover_url text,
  total_pages int,
  isbn text,
  genres text[] default '{}',
  language text,
  country text,
  created_at timestamptz not null default now()
);

alter table books enable row level security;

create policy "books_select_all" on books
  for select to authenticated using (true);

create policy "books_insert_all" on books
  for insert to authenticated with check (true);

-- ─────────────────────────────────────────────
-- user_books
-- ─────────────────────────────────────────────
do $$ begin
  create type book_status as enum ('reading', 'finished', 'on_hold');
exception
  when duplicate_object then null;
end $$;

create table if not exists user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  status book_status not null default 'reading',
  current_page int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  added_at timestamptz not null default now(),
  unique (user_id, book_id)
);

alter table user_books enable row level security;

create policy "user_books_owner_all" on user_books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- reading_sessions
-- ─────────────────────────────────────────────
create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  user_book_id uuid not null references user_books(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_seconds int not null,
  start_page int not null,
  end_page int not null check (end_page >= start_page),
  pages_read int generated always as (end_page - start_page) stored,
  pages_per_hour numeric,
  minutes_per_page numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table reading_sessions enable row level security;

create policy "sessions_owner_all" on reading_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_sessions_user_created
  on reading_sessions (user_id, created_at desc);

-- ─────────────────────────────────────────────
-- reading_goals
-- ─────────────────────────────────────────────
do $$ begin
  create type goal_type as enum ('pages_per_day', 'minutes_per_day', 'pages_per_week');
exception
  when duplicate_object then null;
end $$;

create table if not exists reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  goal_type goal_type not null,
  target_value int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table reading_goals enable row level security;

create policy "goals_owner_all" on reading_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- streaks
-- ─────────────────────────────────────────────
create table if not exists streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_read_date date
);

alter table streaks enable row level security;

create policy "streaks_owner_all" on streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- shared_recaps
-- ─────────────────────────────────────────────
create table if not exists shared_recaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reading_session_id uuid references reading_sessions(id) on delete set null,
  image_url text not null,
  template text not null,
  created_at timestamptz not null default now()
);

alter table shared_recaps enable row level security;

create policy "recaps_owner_all" on shared_recaps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- favorite_books (top 5)
-- ─────────────────────────────────────────────
create table if not exists favorite_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  rank int not null check (rank between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, rank),
  unique (user_id, book_id)
);

alter table favorite_books enable row level security;

create policy "favorites_owner_all" on favorite_books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- tier_lists + tier_list_items
-- ─────────────────────────────────────────────
create table if not exists tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'My Book Tier List',
  tiers jsonb not null default '["S","A","B","C","D"]',
  created_at timestamptz not null default now()
);

alter table tier_lists enable row level security;

create policy "tier_lists_owner_all" on tier_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists tier_list_items (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  tier text not null,
  position int not null default 0
);

alter table tier_list_items enable row level security;

create policy "tier_items_owner_all" on tier_list_items
  for all
  using (exists (select 1 from tier_lists t where t.id = tier_list_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tier_lists t where t.id = tier_list_id and t.user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- reading_lists ("playlists") + reading_list_items
-- ─────────────────────────────────────────────
create table if not exists reading_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_style text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reading_lists enable row level security;

create policy "reading_lists_owner_all" on reading_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists reading_list_items (
  id uuid primary key default gen_random_uuid(),
  reading_list_id uuid not null references reading_lists(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now()
);

alter table reading_list_items enable row level security;

create policy "reading_list_items_owner_all" on reading_list_items
  for all
  using (exists (select 1 from reading_lists r where r.id = reading_list_id and r.user_id = auth.uid()))
  with check (exists (select 1 from reading_lists r where r.id = reading_list_id and r.user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Trigger: auto-create streaks row when profile is created
-- ─────────────────────────────────────────────
create or replace function create_streak_row()
returns trigger language plpgsql security definer as $$
begin
  insert into streaks (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
  after insert on profiles
  for each row execute function create_streak_row();
