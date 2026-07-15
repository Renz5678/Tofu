-- ─────────────────────────────────────────────────────────────────────────────
-- 005_book_cache.sql
--
-- 1. Add cover_storage_url column — Supabase Storage copy of the OL cover
-- 2. Add full-text search index on books(title, author) for fast local search
-- 3. Allow updates to the books table (needed to write cover_storage_url back)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- 1. cover_storage_url column
-- ─────────────────────────────────────────────
alter table books
  add column if not exists cover_storage_url text;

-- ─────────────────────────────────────────────
-- 2. Full-text search index
--    Weight A = title, Weight B = author
--    Stored as a generated tsvector column so Postgres keeps it up to date.
-- ─────────────────────────────────────────────
alter table books
  add column if not exists fts tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(author, '')), 'B')
    ) stored;

create index if not exists idx_books_fts on books using gin(fts);

-- Also create a simple trigram index for prefix / partial matching
-- (e.g. "harr" matching "Harry Potter") — requires pg_trgm extension
create extension if not exists pg_trgm;
create index if not exists idx_books_title_trgm  on books using gin(title  gin_trgm_ops);
create index if not exists idx_books_author_trgm on books using gin(author gin_trgm_ops);

-- ─────────────────────────────────────────────
-- 3. Allow authenticated users to update books
--    (needed to write cover_storage_url back after upload)
-- ─────────────────────────────────────────────
do $$ begin
  create policy "books_update_all" on books
    for update to authenticated using (true) with check (true);
exception
  when duplicate_object then null;
end $$;
