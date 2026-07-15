-- ─────────────────────────────────────────────────────────────────────────────
-- 006_username_improvements.sql
--
-- 1. Replace the owner-only SELECT policy on profiles with an all-authenticated
--    SELECT so that user search (and public profile views) actually work.
-- 2. Add a SECURITY DEFINER RPC so the app can check username availability
--    without ever reading the full profiles table directly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Fix profiles RLS ───────────────────────────────────────────────────────
-- Drop the old owner-only policy (created in 001).
drop policy if exists "profiles_select_own" on profiles;

-- Allow any authenticated user to read any profile row.
-- This is required for: user search, public profile views, review author chips.
do $$ begin
  create policy "profiles_select_all" on profiles
    for select to authenticated using (true);
exception
  when duplicate_object then null;
end $$;

-- ── 2. check_username_available RPC ──────────────────────────────────────────
-- Returns TRUE when the username is free to use, FALSE when already taken.
-- Excludes the calling user's own row so they can "re-save" their current
-- username without it being flagged as taken.
-- SECURITY DEFINER so it can read profiles without the caller needing SELECT.
create or replace function check_username_available(p_username text)
returns boolean
language sql
security definer
stable
as $$
  select not exists (
    select 1
    from profiles
    where lower(username) = lower(trim(p_username))
      -- exclude the current user so they can keep their own username
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

-- Allow any authenticated user to call the function
grant execute on function check_username_available(text) to authenticated;
