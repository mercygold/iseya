alter table public.recruiter_profiles
  add column if not exists recruiter_plan text not null default 'starter',
  add column if not exists recruiter_plan_status text not null default 'free',
  add column if not exists recruiter_active_job_limit integer not null default 2,
  add column if not exists recruiter_visibility_days integer not null default 30,
  add column if not exists recruiter_verified_eligible boolean not null default false,
  add column if not exists recruiter_currency text not null default 'USD',
  add column if not exists recruiter_subscription_started_at timestamptz,
  add column if not exists recruiter_subscription_expires_at timestamptz,
  add column if not exists recruiter_stripe_customer_id text,
  add column if not exists recruiter_stripe_subscription_id text,
  add column if not exists recruiter_processed_stripe_event_ids text[] not null default '{}';

alter table public.job_posts
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz;

update public.job_posts
set published_at = coalesce(published_at, created_at),
    expires_at = coalesce(expires_at, coalesce(published_at, created_at) + interval '30 days')
where status = 'published'
  and opportunity_type <> 'curated_opportunity';

update public.job_posts
set status = 'expired'
where status = 'published'
  and opportunity_type <> 'curated_opportunity'
  and expires_at is not null
  and expires_at <= now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recruiter_profiles_plan_check'
      and conrelid = 'public.recruiter_profiles'::regclass
  ) then
    alter table public.recruiter_profiles
      add constraint recruiter_profiles_plan_check
      check (recruiter_plan in ('starter', 'recruiter_quarterly', 'recruiter_annual'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recruiter_profiles_plan_status_check'
      and conrelid = 'public.recruiter_profiles'::regclass
  ) then
    alter table public.recruiter_profiles
      add constraint recruiter_profiles_plan_status_check
      check (recruiter_plan_status in ('free', 'active', 'past_due', 'canceled', 'inactive'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recruiter_profiles_currency_check'
      and conrelid = 'public.recruiter_profiles'::regclass
  ) then
    alter table public.recruiter_profiles
      add constraint recruiter_profiles_currency_check
      check (recruiter_currency in ('USD', 'NGN', 'GBP', 'CAD'));
  end if;
end $$;

create index if not exists recruiter_profiles_stripe_customer_idx
  on public.recruiter_profiles(recruiter_stripe_customer_id);

create index if not exists job_posts_native_visibility_idx
  on public.job_posts(recruiter_id, status, expires_at)
  where opportunity_type <> 'curated_opportunity';

drop policy if exists "job_posts_insert_recruiter_own" on public.job_posts;
create policy "job_posts_insert_recruiter_own"
  on public.job_posts for insert
  with check (
    auth.uid() = recruiter_id
    and opportunity_type <> 'curated_opportunity'
    and (
      status = 'draft'
      or (
        status = 'pending_review'
        and exists (
          select 1 from public.recruiter_profiles
          where recruiter_profiles.user_id = auth.uid()
            and recruiter_profiles.verification_status = 'verified'
        )
      )
    )
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
    (
      auth.uid() = recruiter_id
      and opportunity_type <> 'curated_opportunity'
      and status in ('draft', 'pending_review', 'closed', 'archived')
    )
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
    (
      status = 'published'
      and (expires_at is null or expires_at > now())
    )
    or auth.uid() = recruiter_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );
