-- =========================================================
-- HOOKIFY AI — COMPLETE FIX (tables + storage RLS)
--
-- WHY THIS FILE EXISTS
-- The original schema only partially applied last time — only `profiles`
-- was created. Everything else failed silently. This file:
--   • Enables required Postgres extensions
--   • Re-creates ALL 5 app tables (idempotent)
--   • Re-creates the auto-profile trigger
--   • Installs every RLS policy on tables AND on storage.objects
--   • Ends with a diagnostic SELECT so you can confirm it worked
--
-- HOW TO RUN
-- 1) Open https://supabase.com/dashboard/project/raaxstgbhpgdlszkalfc/sql/new
-- 2) Paste this ENTIRE file
-- 3) Click RUN
-- 4) Scroll to the bottom Results panel — you should see 5 table rows + 5 policy rows
-- Safe to re-run any number of times.
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1) profiles  (already exists for some — kept idempotent)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  plan text not null default 'free',
  minutes_used_month numeric not null default 0,
  minutes_quota_month numeric not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles read own"   on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles read own"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- 2) ai_projects  — one row per uploaded source video
-- =========================================================
create table if not exists public.ai_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text,
  source_bucket text not null default 'hookify-sources',
  source_key text not null,
  content_type text,
  size_bytes bigint,
  language text,
  duration_seconds numeric,
  transcript_segments jsonb default '[]'::jsonb,
  transcript_text text,
  suggestions jsonb default '[]'::jsonb,
  status text not null default 'queued',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_projects enable row level security;
drop policy if exists "ai_projects all own" on public.ai_projects;
create policy "ai_projects all own" on public.ai_projects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists ai_projects_user_idx on public.ai_projects(user_id, created_at desc);

-- =========================================================
-- 3) saved_clips
-- =========================================================
create table if not exists public.saved_clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.ai_projects(id) on delete set null,
  render_job_id uuid,
  title text,
  hook text,
  caption_text text,
  caption_style text default 'Bold',
  platform text default 'TikTok',
  status text default 'Idea',
  start_seconds numeric not null default 0,
  end_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  confidence integer,
  source_filename text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.saved_clips enable row level security;
drop policy if exists "saved_clips all own" on public.saved_clips;
create policy "saved_clips all own" on public.saved_clips
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists saved_clips_user_idx on public.saved_clips(user_id, updated_at desc);

-- =========================================================
-- 4) render_jobs
-- =========================================================
create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.ai_projects(id) on delete cascade,
  saved_clip_id uuid references public.saved_clips(id) on delete set null,
  title text,
  caption_text text,
  platform text,
  start_seconds numeric not null,
  end_seconds numeric not null,
  duration_seconds numeric not null,
  status text not null default 'preparing',
  stage_label text default 'Preparing clip',
  progress integer not null default 5,
  output_bucket text default 'hookify-renders',
  output_key text,
  size_bytes bigint,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.render_jobs enable row level security;
drop policy if exists "render_jobs select own" on public.render_jobs;
drop policy if exists "render_jobs insert own" on public.render_jobs;
-- Backend updates via service-role (bypasses RLS), so no update policy needed.
create policy "render_jobs select own" on public.render_jobs
  for select to authenticated using (user_id = auth.uid());
create policy "render_jobs insert own" on public.render_jobs
  for insert to authenticated with check (user_id = auth.uid());
create index if not exists render_jobs_user_idx on public.render_jobs(user_id, created_at desc);

-- =========================================================
-- 5) user_settings
-- =========================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creator_name text default '',
  preferred_platform text default 'TikTok',
  caption_style text default 'Bold',
  default_clip_length integer default 30,
  brand_tone text default 'Energetic',
  active_template_id text,
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "user_settings all own" on public.user_settings;
create policy "user_settings all own" on public.user_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- 6) STORAGE policies — the actual cause of your upload error
-- =========================================================
alter table storage.objects enable row level security;

-- Nuke any older/partial policies so we start clean.
drop policy if exists "hookify sources insert"  on storage.objects;
drop policy if exists "hookify sources select"  on storage.objects;
drop policy if exists "hookify sources update"  on storage.objects;
drop policy if exists "hookify sources delete"  on storage.objects;
drop policy if exists "hookify renders select"  on storage.objects;
drop policy if exists "sources user folder all" on storage.objects;
drop policy if exists "renders user folder read" on storage.objects;

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

create policy "hookify renders select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'hookify-renders'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- DIAGNOSTIC — scroll down in the Results panel to verify
-- =========================================================

-- Tables that exist:
select 'TABLE' as kind, table_name as name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','ai_projects','saved_clips','render_jobs','user_settings')

union all

-- Storage policies installed:
select 'STORAGE POLICY' as kind, policyname as name
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'hookify %'

order by kind, name;

-- ✅ Expected output (10 rows):
--   STORAGE POLICY   hookify renders select
--   STORAGE POLICY   hookify sources delete
--   STORAGE POLICY   hookify sources insert
--   STORAGE POLICY   hookify sources select
--   STORAGE POLICY   hookify sources update
--   TABLE            ai_projects
--   TABLE            profiles
--   TABLE            render_jobs
--   TABLE            saved_clips
--   TABLE            user_settings
