alter table public.recruiter_profiles
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists linkedin_company_url text,
  add column if not exists phone_number text not null default '',
  add column if not exists phone_verified boolean not null default false,
  add column if not exists address_line_1 text not null default '',
  add column if not exists address_line_2 text,
  add column if not exists city text not null default '',
  add column if not exists state_region text not null default '',
  add column if not exists postal_code text,
  add column if not exists country text not null default '',
  add column if not exists industry_other text,
  add column if not exists verification_notes text;

update public.recruiter_profiles
set id = gen_random_uuid()
where id is null;

alter table public.recruiter_profiles
  alter column id set not null;

create unique index if not exists recruiter_profiles_id_idx
  on public.recruiter_profiles(id);

create index if not exists recruiter_profiles_user_id_idx
  on public.recruiter_profiles(user_id);

create index if not exists recruiter_profiles_status_created_idx
  on public.recruiter_profiles(verification_status, created_at desc);

alter table public.job_posts
  add column if not exists salary_currency text,
  add column if not exists salary_min numeric,
  add column if not exists salary_max numeric,
  add column if not exists salary_period text;

alter table public.job_posts
  alter column status set default 'draft';

create index if not exists job_posts_pending_review_idx
  on public.job_posts(status, created_at desc)
  where status = 'pending_review';

alter table public.recruiter_profiles enable row level security;
alter table public.job_posts enable row level security;

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
