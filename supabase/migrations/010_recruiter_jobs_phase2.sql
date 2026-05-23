alter table public.profiles
  add column if not exists account_type text not null default 'candidate';

create index if not exists profiles_account_type_idx
  on public.profiles(account_type);

create table if not exists public.recruiter_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null default '',
  recruiter_name text not null default '',
  work_email text not null default '',
  company_website text,
  company_location text,
  industry text,
  company_size text,
  hiring_focus text,
  verification_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles(id) on delete cascade,
  job_title text not null,
  company_name text not null,
  location text not null default '',
  workplace_type text not null default 'remote',
  employment_type text not null default 'full-time',
  salary_range text,
  role_summary text not null default '',
  responsibilities text not null default '',
  requirements text not null default '',
  skills text[] not null default '{}',
  application_deadline date,
  application_url text,
  status text not null default 'draft',
  applicants_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  recruiter_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted',
  candidate_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

drop trigger if exists recruiter_profiles_set_updated_at on public.recruiter_profiles;
create trigger recruiter_profiles_set_updated_at
before update on public.recruiter_profiles
for each row execute function public.set_updated_at();

drop trigger if exists job_posts_set_updated_at on public.job_posts;
create trigger job_posts_set_updated_at
before update on public.job_posts
for each row execute function public.set_updated_at();

alter table public.recruiter_profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "recruiter_profiles_select_own_or_admin" on public.recruiter_profiles;
create policy "recruiter_profiles_select_own_or_admin"
  on public.recruiter_profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "recruiter_profiles_insert_own" on public.recruiter_profiles;
create policy "recruiter_profiles_insert_own"
  on public.recruiter_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "recruiter_profiles_update_own_or_admin" on public.recruiter_profiles;
create policy "recruiter_profiles_update_own_or_admin"
  on public.recruiter_profiles for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_posts_select_public_own_or_admin" on public.job_posts;
create policy "job_posts_select_public_own_or_admin"
  on public.job_posts for select
  using (
    status = 'published'
    or auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_posts_insert_recruiter_own" on public.job_posts;
create policy "job_posts_insert_recruiter_own"
  on public.job_posts for insert
  with check (
    auth.uid() = recruiter_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_type in ('recruiter', 'admin')
    )
  );

drop policy if exists "job_posts_update_recruiter_own_or_admin" on public.job_posts;
create policy "job_posts_update_recruiter_own_or_admin"
  on public.job_posts for update
  using (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  )
  with check (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_posts_delete_recruiter_own_or_admin" on public.job_posts;
create policy "job_posts_delete_recruiter_own_or_admin"
  on public.job_posts for delete
  using (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_applications_select_participants_or_admin" on public.job_applications;
create policy "job_applications_select_participants_or_admin"
  on public.job_applications for select
  using (
    auth.uid() = candidate_id
    or auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_applications_insert_candidate_own" on public.job_applications;
create policy "job_applications_insert_candidate_own"
  on public.job_applications for insert
  with check (auth.uid() = candidate_id);

drop policy if exists "job_applications_update_recruiter_or_admin" on public.job_applications;
create policy "job_applications_update_recruiter_or_admin"
  on public.job_applications for update
  using (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  )
  with check (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

create index if not exists recruiter_profiles_verification_status_idx
  on public.recruiter_profiles(verification_status);

create index if not exists job_posts_recruiter_id_idx
  on public.job_posts(recruiter_id);

create index if not exists job_posts_status_idx
  on public.job_posts(status);

create index if not exists job_posts_created_at_idx
  on public.job_posts(created_at desc);

create index if not exists job_applications_job_id_idx
  on public.job_applications(job_id);

create index if not exists job_applications_candidate_id_idx
  on public.job_applications(candidate_id);

create index if not exists job_applications_recruiter_id_idx
  on public.job_applications(recruiter_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    subscription_status,
    subscription_plan,
    account_type
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'free',
    'free',
    coalesce(nullif(new.raw_user_meta_data->>'account_type', ''), 'candidate')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        account_type = coalesce(nullif(excluded.account_type, ''), public.profiles.account_type);
  return new;
end;
$$;
