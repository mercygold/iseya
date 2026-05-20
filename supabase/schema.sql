create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_version_id text,
  resume_name text not null,
  target_role text,
  industry text,
  company_name text,
  job_description text,
  edited_resume_data jsonb not null default '{}'::jsonb,
  cover_letter_data jsonb not null default '{}'::jsonb,
  linkedin_kit jsonb not null default '{}'::jsonb,
  application_kit jsonb not null default '{}'::jsonb,
  ai_coach_notes jsonb not null default '{}'::jsonb,
  recruiter_simulation jsonb not null default '{}'::jsonb,
  selected_template text,
  selected_theme text,
  match_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploaded_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_version_id uuid references public.resume_versions(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size bigint,
  extraction_status text,
  extracted_text_summary text,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.resume_versions enable row level security;
alter table public.uploaded_sources enable row level security;
alter table public.usage_events enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "resume_versions_manage_own"
  on public.resume_versions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "uploaded_sources_manage_own"
  on public.uploaded_sources for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "usage_events_manage_own"
  on public.usage_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists resume_versions_user_updated_idx
  on public.resume_versions(user_id, updated_at desc);

create index if not exists uploaded_sources_version_idx
  on public.uploaded_sources(resume_version_id);

create index if not exists usage_events_user_created_idx
  on public.usage_events(user_id, created_at desc);
