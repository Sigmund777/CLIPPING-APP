-- =========================================================
-- Hookify AI — Supabase schema + RLS bootstrap
-- Paste this into your Supabase project → SQL Editor → Run.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =========================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  plan text not null default 'free',          -- free | starter | pro | business
  minutes_used_month numeric not null default 0,
  minutes_quota_month numeric not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ai_projects (one row per uploaded source video) ----------
create table if not exists public.ai_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text,
  source_bucket text not null default 'hookify-sources',
  source_key text not null,                   -- e.g. '<user_id>/<uuid>.mp4'
  content_type text,
  size_bytes bigint,
  language text,
  duration_seconds numeric,
  transcript_segments jsonb default '[]'::jsonb,
  transcript_text text,
  suggestions jsonb default '[]'::jsonb,
  status text not null default 'queued',      -- queued | processing | ready | failed
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_projects enable row level security;

drop policy if exists "projects own" on public.ai_projects;
create policy "projects own" on public.ai_projects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists ai_projects_user_idx on public.ai_projects(user_id, created_at desc);

-- ---------- saved_clips ----------
create table if not exists public.saved_clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.ai_projects(id) on delete set null,
  render_job_id uuid,                          -- soft FK; filled after a render completes
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

drop policy if exists "saved clips own" on public.saved_clips;
create policy "saved clips own" on public.saved_clips
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists saved_clips_user_idx on public.saved_clips(user_id, updated_at desc);

-- ---------- render_jobs ----------
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
  status text not null default 'preparing',    -- preparing | downloading | cutting | formatting | captions | rendering | uploading | ready | failed
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

drop policy if exists "render jobs own" on public.render_jobs;
create policy "render jobs own" on public.render_jobs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "render jobs insert own" on public.render_jobs;
create policy "render jobs insert own" on public.render_jobs
  for insert to authenticated with check (user_id = auth.uid());

-- Backend uses service-role and bypasses RLS for updates/deletes — no policy needed.

create index if not exists render_jobs_user_idx on public.render_jobs(user_id, created_at desc);

-- ---------- user_settings ----------
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

drop policy if exists "settings own" on public.user_settings;
create policy "settings own" on public.user_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- Storage policies — applied to storage.objects
-- Run AFTER creating buckets 'hookify-sources' and 'hookify-renders'.
-- =========================================================

drop policy if exists "sources user folder all" on storage.objects;
create policy "sources user folder all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'hookify-sources'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'hookify-sources'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

drop policy if exists "renders user folder read" on storage.objects;
create policy "renders user folder read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'hookify-renders'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

-- Backend uses service-role and bypasses RLS for writes to hookify-renders.

-- =========================================================
-- DONE. Verify in Table Editor that 5 tables exist:
--   profiles, ai_projects, saved_clips, render_jobs, user_settings
-- Verify in Storage that both buckets are PRIVATE and have policies attached.
-- =========================================================
