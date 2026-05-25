create table if not exists public.institution_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution_name text not null default '',
  institution_type text not null default 'University',
  admin_name text not null default '',
  admin_email text not null default '',
  website text not null default '',
  country text not null default '',
  state_region text,
  city text not null default '',
  student_email_domain text not null default '',
  access_status text not null default 'pending_review',
  access_start_date date,
  access_end_date date,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institution_profiles_type_check check (
    institution_type in ('University', 'College', 'Bootcamp', 'Career Program', 'Workforce Development', 'Other')
  ),
  constraint institution_profiles_status_check check (
    access_status in ('pending_review', 'active', 'rejected', 'expired')
  )
);

create unique index if not exists institution_profiles_user_id_key
  on public.institution_profiles(user_id);

create index if not exists institution_profiles_domain_status_idx
  on public.institution_profiles(lower(student_email_domain), access_status);

drop trigger if exists institution_profiles_set_updated_at on public.institution_profiles;
create trigger institution_profiles_set_updated_at
before update on public.institution_profiles
for each row execute function public.set_updated_at();

alter table public.profiles
  add column if not exists institution_id uuid references public.institution_profiles(id) on delete set null;

create index if not exists profiles_institution_id_idx
  on public.profiles(institution_id);

alter table public.institution_profiles enable row level security;

drop policy if exists "institution_profiles_select_own_or_admin" on public.institution_profiles;
create policy "institution_profiles_select_own_or_admin"
  on public.institution_profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "institution_profiles_insert_own" on public.institution_profiles;
create policy "institution_profiles_insert_own"
  on public.institution_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "institution_profiles_update_own_or_admin" on public.institution_profiles;
create policy "institution_profiles_update_own_or_admin"
  on public.institution_profiles for update
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

