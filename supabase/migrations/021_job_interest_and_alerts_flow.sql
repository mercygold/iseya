alter table public.job_applications
  alter column candidate_id drop not null,
  add column if not exists candidate_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists candidate_email text,
  add column if not exists full_name text not null default '',
  add column if not exists phone_number text not null default '',
  add column if not exists location text not null default '',
  add column if not exists short_note text not null default '',
  add column if not exists resume_file_url text,
  add column if not exists cover_letter_file_url text,
  add column if not exists updated_at timestamptz not null default now();

update public.job_applications
set candidate_user_id = candidate_id
where candidate_user_id is null
  and candidate_id is not null;

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at
before update on public.job_applications
for each row execute function public.set_updated_at();

create index if not exists job_applications_candidate_user_id_idx
  on public.job_applications(candidate_user_id);

create index if not exists job_applications_candidate_email_idx
  on public.job_applications(lower(candidate_email));

create index if not exists job_applications_recruiter_status_idx
  on public.job_applications(recruiter_id, status, created_at desc);

create table if not exists public.job_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.profiles(id) on delete set null,
  email text not null,
  keyword text not null default '',
  title_preference text not null default '',
  location_preference text not null default '',
  job_type_preference text not null default '',
  workplace_type_preference text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_alert_subscriptions
  add column if not exists candidate_id uuid references public.profiles(id) on delete set null,
  add column if not exists email text,
  add column if not exists keyword text not null default '',
  add column if not exists title_preference text not null default '',
  add column if not exists location_preference text not null default '',
  add column if not exists job_type_preference text not null default '',
  add column if not exists workplace_type_preference text not null default '',
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists job_alert_subscriptions_set_updated_at on public.job_alert_subscriptions;
create trigger job_alert_subscriptions_set_updated_at
before update on public.job_alert_subscriptions
for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;
alter table public.job_alert_subscriptions enable row level security;

drop policy if exists "job_applications_select_participants_or_admin" on public.job_applications;
create policy "job_applications_select_participants_or_admin"
  on public.job_applications for select
  using (
    auth.uid() = candidate_user_id
    or auth.uid() = candidate_id
    or auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

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

drop policy if exists "job_alert_subscriptions_select_own_or_admin" on public.job_alert_subscriptions;
create policy "job_alert_subscriptions_select_own_or_admin"
  on public.job_alert_subscriptions for select
  using (
    auth.uid() = candidate_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_alert_subscriptions_insert_own_or_public" on public.job_alert_subscriptions;
create policy "job_alert_subscriptions_insert_own_or_public"
  on public.job_alert_subscriptions for insert
  with check (candidate_id is null or auth.uid() = candidate_id);

create index if not exists job_alert_subscriptions_email_idx
  on public.job_alert_subscriptions(lower(email));

create index if not exists job_alert_subscriptions_status_idx
  on public.job_alert_subscriptions(status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-application-files',
  'job-application-files',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
