alter table public.profiles
  add column if not exists account_type text not null default 'candidate',
  add column if not exists role text,
  add column if not exists app_role text;

alter table public.recruiter_profiles
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists company_name text not null default '',
  add column if not exists recruiter_name text not null default '',
  add column if not exists work_email text not null default '',
  add column if not exists company_website text,
  add column if not exists linkedin_company_url text,
  add column if not exists phone_number text not null default '',
  add column if not exists phone_verified boolean not null default false,
  add column if not exists address_line_1 text not null default '',
  add column if not exists address_line_2 text,
  add column if not exists city text not null default '',
  add column if not exists state_region text not null default '',
  add column if not exists postal_code text,
  add column if not exists country text not null default '',
  add column if not exists company_location text,
  add column if not exists industry text,
  add column if not exists industry_other text,
  add column if not exists company_size text,
  add column if not exists hiring_focus text,
  add column if not exists verification_status text not null default 'pending_review',
  add column if not exists verification_notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.recruiter_profiles
set id = gen_random_uuid()
where id is null;

alter table public.recruiter_profiles
  alter column id set not null;

create unique index if not exists recruiter_profiles_id_idx
  on public.recruiter_profiles(id);

create unique index if not exists recruiter_profiles_user_id_unique_idx
  on public.recruiter_profiles(user_id);

create index if not exists recruiter_profiles_verification_status_idx
  on public.recruiter_profiles(verification_status);

alter table public.profiles enable row level security;
alter table public.recruiter_profiles enable row level security;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

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
