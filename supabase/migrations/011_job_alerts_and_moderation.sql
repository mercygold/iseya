create table if not exists public.job_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.profiles(id) on delete set null,
  email text not null,
  title_query text not null default '',
  location_query text not null default '',
  employment_type text not null default '',
  remote_only boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists job_alert_subscriptions_set_updated_at on public.job_alert_subscriptions;
create trigger job_alert_subscriptions_set_updated_at
before update on public.job_alert_subscriptions
for each row execute function public.set_updated_at();

alter table public.job_alert_subscriptions enable row level security;

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

drop policy if exists "job_alert_subscriptions_update_own_or_admin" on public.job_alert_subscriptions;
create policy "job_alert_subscriptions_update_own_or_admin"
  on public.job_alert_subscriptions for update
  using (
    auth.uid() = candidate_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  )
  with check (
    auth.uid() = candidate_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_alert_subscriptions_delete_own_or_admin" on public.job_alert_subscriptions;
create policy "job_alert_subscriptions_delete_own_or_admin"
  on public.job_alert_subscriptions for delete
  using (
    auth.uid() = candidate_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

create index if not exists job_alert_subscriptions_candidate_id_idx
  on public.job_alert_subscriptions(candidate_id);

create index if not exists job_alert_subscriptions_email_idx
  on public.job_alert_subscriptions(lower(email));

create index if not exists job_alert_subscriptions_status_idx
  on public.job_alert_subscriptions(status);
