# Tofu — Coding Agent Context

Mobile reading tracker. React Native (Expo) + Supabase. This document is the
technical source of truth for implementation — treat it as the spec to build
against, not a suggestion. Full PDR available separately if deeper rationale
is needed; this file is the condensed, build-ready version.

## 1. What This App Does

Readers add books, run a timer while they read, log the page they reached,
and the app derives duration/pace/progress automatically. On top of that
there's a curation layer (favorites, tier lists, playlists) and a
shareable-image export of reading stats. Think "fitness tracker, but for
reading."

## 2. Stack

- **Framework:** React Native + Expo (managed workflow), Expo Router (file-based nav)
- **Backend:** Supabase — Postgres + Auth + Storage + Realtime (optional)
- **Server state:** TanStack Query (`@tanstack/react-query`) against the Supabase client
- **Local/ephemeral state:** Zustand — active timer, in-flight drag reorder
- **Local persistence:** `expo-secure-store` / `AsyncStorage` for the in-progress session
- **Drag & drop:** `react-native-gesture-handler` + `react-native-reanimated` (or `react-native-draggable-flatlist`)
- **Charts:** `victory-native` or `react-native-gifted-charts`
- **Images:** `expo-image`
- **Share card export:** `react-native-view-shot` + `expo-sharing`
- **External data:** Open Library API (`https://openlibrary.org/search.json`)

Build target: iOS + Android from one codebase. No custom backend server —
client talks to Supabase directly, secured with Row Level Security (RLS).

## 3. Database Schema (Supabase / Postgres)

Run as migrations. Every user-scoped table gets RLS: owner-only
`SELECT/INSERT/UPDATE/DELETE` via `auth.uid() = user_id`. `books` is a shared
reference table (readable by all authenticated users, insertable by any
authenticated user, no update/delete from clients).

```sql
-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────────
-- books (shared reference table)
-- ─────────────────────────────────────────────
create table books (
  id uuid primary key default gen_random_uuid(),
  open_library_id text unique not null,
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
create policy "books_select_all" on books for select to authenticated using (true);
create policy "books_insert_all" on books for insert to authenticated with check (true);

-- ─────────────────────────────────────────────
-- user_books
-- ─────────────────────────────────────────────
create type book_status as enum ('reading', 'finished', 'on_hold');

create table user_books (
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
create policy "user_books_owner_all" on user_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- reading_sessions
-- ─────────────────────────────────────────────
create table reading_sessions (
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
create policy "sessions_owner_all" on reading_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_sessions_user_created on reading_sessions (user_id, created_at desc);

-- ─────────────────────────────────────────────
-- reading_goals
-- ─────────────────────────────────────────────
create type goal_type as enum ('pages_per_day', 'minutes_per_day', 'pages_per_week');

create table reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  goal_type goal_type not null,
  target_value int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table reading_goals enable row level security;
create policy "goals_owner_all" on reading_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- streaks
-- ─────────────────────────────────────────────
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_read_date date
);

alter table streaks enable row level security;
create policy "streaks_owner_all" on streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- shared_recaps (optional persistence of exported cards)
-- ─────────────────────────────────────────────
create table shared_recaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reading_session_id uuid references reading_sessions(id) on delete set null,
  image_url text not null,
  template text not null,
  created_at timestamptz not null default now()
);

alter table shared_recaps enable row level security;
create policy "recaps_owner_all" on shared_recaps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- favorite_books (top 5)
-- ─────────────────────────────────────────────
create table favorite_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  rank int not null check (rank between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, rank),
  unique (user_id, book_id)
);

alter table favorite_books enable row level security;
create policy "favorites_owner_all" on favorite_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- tier_lists + tier_list_items
-- ─────────────────────────────────────────────
create table tier_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'My Book Tier List',
  tiers jsonb not null default '["S","A","B","C","D"]',
  created_at timestamptz not null default now()
);

alter table tier_lists enable row level security;
create policy "tier_lists_owner_all" on tier_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table tier_list_items (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  tier text not null,
  position int not null default 0
);

alter table tier_list_items enable row level security;
create policy "tier_items_owner_all" on tier_list_items for all
  using (exists (select 1 from tier_lists t where t.id = tier_list_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tier_lists t where t.id = tier_list_id and t.user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- reading_lists ("playlists") + reading_list_items
-- ─────────────────────────────────────────────
create table reading_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_style text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reading_lists enable row level security;
create policy "reading_lists_owner_all" on reading_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table reading_list_items (
  id uuid primary key default gen_random_uuid(),
  reading_list_id uuid not null references reading_lists(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now()
);

alter table reading_list_items enable row level security;
create policy "reading_list_items_owner_all" on reading_list_items for all
  using (exists (select 1 from reading_lists r where r.id = reading_list_id and r.user_id = auth.uid()))
  with check (exists (select 1 from reading_lists r where r.id = reading_list_id and r.user_id = auth.uid()));
```

### Notes on the schema
- `pages_read` is a Postgres generated column — don't write to it, just insert `start_page`/`end_page`.
- `pages_per_hour` / `minutes_per_page` are computed client-side at session-finish time and written directly (kept redundant on the row for fast dashboard reads — don't recompute via a view unless a bug is found).
- `favorite_books` uses two unique constraints so the UI never has to dedupe slots or books — trust the DB to reject invalid states.
- `country` on `books` is nullable and best-effort (Open Library has no reliable country field) — don't build filtering logic that assumes it's always populated.

## 4. Suggested Project Structure (Expo Router)

```
app/
  (auth)/
    sign-in.tsx
    sign-up.tsx
  (tabs)/
    dashboard.tsx
    library.tsx
    search.tsx
    stats.tsx
    profile.tsx
  book/[id].tsx
  session/active.tsx
  session/finish.tsx
  favorites/index.tsx
  tier-lists/index.tsx
  tier-lists/[id].tsx
  playlists/index.tsx
  playlists/[id].tsx
  share/[type]/[id].tsx        # recap, tier-list, favorites, playlist share preview
  goals/index.tsx
lib/
  supabase.ts                  # Supabase client init
  openLibrary.ts                # search, genre/language query builders
  timer.ts                      # session timer logic, AsyncStorage persistence
  metrics.ts                    # pages/hr, min/page, streak calc
  shareCard.ts                  # view-shot capture + expo-sharing helpers
store/
  sessionStore.ts               # Zustand: active timer state
  dragStore.ts                  # Zustand: in-flight tier/playlist reorder state
components/
  BookCard.tsx
  ProgressBar.tsx
  TimerControls.tsx
  TierBoard.tsx
  PlaylistCoverCollage.tsx
  RecapCardTemplate/
    SessionRecap.tsx
    FavoritesRecap.tsx
    TierListRecap.tsx
  FilterBar.tsx                 # genre / language / country / status chips
hooks/
  useReadingSessions.ts
  useLibrary.ts
  useFavorites.ts
  useTierLists.ts
  usePlaylists.ts
```

## 5. Feature Build Order (matches PDR roadmap)

1. **Auth + schema** — Supabase project, run migrations above, wire `supabase-js`, sign up/login screens, `profiles` row auto-created on signup (trigger or client-side upsert).
2. **Library core** — Open Library search, add-to-library flow (upsert into `books`, insert `user_books`), library screen grouped by status, genre/language/country filter bar.
3. **Session timer** — start/pause/finish flow, local persistence of in-progress session, write to `reading_sessions` on finish, update `user_books.current_page`.
4. **Dashboard + stats** — today's stats, streak display, weekly chart, aggregate stats screen with daily/weekly/monthly toggle.
5. **Goals + streaks** — goal CRUD, progress rings, streak increment logic (once per calendar day with ≥1 session).
6. **Curation** — favorites (5 fixed slots), tier lists (drag-and-drop board), playlists (create/add/reorder, auto-cover collage).
7. **Share card** — off-screen styled views at 1080×1920, `view-shot` capture, `expo-sharing` share sheet, templates for session recap / favorites / tier list.
8. **Polish** — empty states, error handling, loading skeletons, iOS/Android QA pass.

Build and verify each phase before moving to the next — don't jump ahead to curation features before the session timer is solid, since favorites/tier lists/playlists all assume a populated `books`/`user_books` table to pull from.

## 6. Open Library API Integration

- Search: `GET https://openlibrary.org/search.json?q={query}`
- Genre filter: append `&subject={genre}`
- Language filter: append `&language={code}`
- Debounce search input ~400ms client-side.
- Map response → local shape:
  ```ts
  {
    open_library_id: item.key,
    title: item.title,
    author: item.author_name?.join(", "),
    cover_url: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : undefined,
    total_pages: item.number_of_pages_median,
    isbn: item.isbn?.[0],
    genres: item.subject?.slice(0, 3) ?? [],
    language: item.language?.[0],
    country: null, // not reliably available — leave null, user-editable later
  }
  ```
- On "Add to Library": upsert on `open_library_id` conflict, then insert `user_books` row.

## 7. Key Implementation Details

**Timer persistence** — on Start, write `{ user_book_id, start_page, start_time }` to AsyncStorage immediately. On app relaunch, check for this key before rendering the dashboard; if present, resume the active-session UI instead of losing it. Clear the key only after a successful `reading_sessions` insert.

**Metrics calculation** (on session finish):
```ts
const duration_seconds = differenceInSeconds(end_time, start_time) - pausedSeconds;
const pages_read = end_page - start_page;
const pages_per_hour = pages_read / (duration_seconds / 3600);
const minutes_per_page = (duration_seconds / 60) / pages_read;
```

**Streak update** (run after every session insert):
- If `last_read_date` is today → no change.
- If `last_read_date` is yesterday → `current_streak += 1`, update `last_read_date`.
- Else → `current_streak = 1`, update `last_read_date`.
- `longest_streak = max(longest_streak, current_streak)` always.

**Drag-and-drop (tier lists / playlists)** — update local Zustand state instantly on drop; batch-write the resulting `position`/`tier` values to Supabase (single upsert of changed rows, not one request per item moved).

**Playlist cover collage** — composite up to 4 cover thumbnails into a grid using `expo-image` + a simple `View` grid, capture once with `view-shot`, store the resulting layout id in `cover_style` so it isn't recomposited on every render.

**Share card** — build each template as a fixed-size (1080×1920 or 1080×1080) off-screen `View`, capture with `captureRef()` from `react-native-view-shot`, share the resulting PNG via `expo-sharing.shareAsync()`. Cover art should already be cached locally — don't refetch at share time.

## 8. Conventions

- TypeScript throughout.
- Supabase types generated via `supabase gen types typescript` — keep them in sync with the schema above whenever a migration changes.
- Server state via React Query hooks in `hooks/`, one hook per resource (`useLibrary`, `useFavorites`, etc.) — components don't call `supabase-js` directly.
- No business logic in components — calculations (metrics, streaks) live in `lib/metrics.ts` and are unit-testable in isolation.
- Prefer full-file output over partial diffs when generating code, and verify each phase (build + run) before moving to the next feature.