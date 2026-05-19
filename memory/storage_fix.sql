-- =========================================================
-- Hookify AI — STORAGE RLS FIX
--
-- Paste this in your Supabase SQL Editor and click RUN.
-- Safe to re-run (DROP IF EXISTS guards everything).
--
-- This installs the policies that allow each signed-in user to:
--   1. Upload files into  hookify-sources/<their_uid>/...
--   2. Read/list/delete their own files in that bucket
--   3. Read their own files in hookify-renders (writes happen server-side)
--
-- After running, verify with:
--   select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';
-- You should see at least 6 policies starting with "hookify ".
-- =========================================================

-- Make sure RLS is on for storage.objects (Supabase enables it by default; this is a safety net).
alter table storage.objects enable row level security;

-- Clear any old/partial Hookify policies so we start clean.
drop policy if exists "hookify sources insert"  on storage.objects;
drop policy if exists "hookify sources select"  on storage.objects;
drop policy if exists "hookify sources update"  on storage.objects;
drop policy if exists "hookify sources delete"  on storage.objects;
drop policy if exists "hookify renders select"  on storage.objects;
drop policy if exists "hookify renders insert service" on storage.objects;
-- Also nuke older permissive policies that may have been created earlier.
drop policy if exists "sources user folder all" on storage.objects;
drop policy if exists "renders user folder read" on storage.objects;

-- =========================================================
-- hookify-sources : the user owns objects under <auth.uid>/*
-- =========================================================
create policy "hookify sources insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'hookify-sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "hookify sources select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'hookify-sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "hookify sources update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'hookify-sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'hookify-sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "hookify sources delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'hookify-sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- hookify-renders : reads only — the FastAPI backend writes via service-role
-- (service-role bypasses RLS, so no insert policy needed for authenticated users).
-- =========================================================
create policy "hookify renders select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'hookify-renders'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- Quick sanity report (you'll see the rows in the SQL Editor "Results" panel).
-- =========================================================
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'hookify %'
order by policyname;
