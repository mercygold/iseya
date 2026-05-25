create table if not exists public.job_application_recruiter_notes (
  application_id uuid primary key references public.job_applications(id) on delete cascade,
  recruiter_id uuid not null references public.profiles(id) on delete cascade,
  recruiter_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists job_application_recruiter_notes_set_updated_at
  on public.job_application_recruiter_notes;
create trigger job_application_recruiter_notes_set_updated_at
before update on public.job_application_recruiter_notes
for each row execute function public.set_updated_at();

create index if not exists job_application_recruiter_notes_recruiter_idx
  on public.job_application_recruiter_notes(recruiter_id, updated_at desc);

alter table public.job_application_recruiter_notes enable row level security;

drop policy if exists "job_application_recruiter_notes_select_owner_or_admin"
  on public.job_application_recruiter_notes;
create policy "job_application_recruiter_notes_select_owner_or_admin"
  on public.job_application_recruiter_notes for select
  using (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_application_recruiter_notes_insert_owner_or_admin"
  on public.job_application_recruiter_notes;
create policy "job_application_recruiter_notes_insert_owner_or_admin"
  on public.job_application_recruiter_notes for insert
  with check (
    auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_application_recruiter_notes_update_owner_or_admin"
  on public.job_application_recruiter_notes;
create policy "job_application_recruiter_notes_update_owner_or_admin"
  on public.job_application_recruiter_notes for update
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

