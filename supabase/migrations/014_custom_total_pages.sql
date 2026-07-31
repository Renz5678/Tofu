-- ─────────────────────────────────────────────────────────────────────────────
-- 014_custom_total_pages.sql
-- Add custom_total_pages to user_books so users can override shared page counts
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_books
ADD COLUMN custom_total_pages int;
