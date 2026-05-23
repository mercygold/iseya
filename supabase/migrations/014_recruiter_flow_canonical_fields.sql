alter table public.recruiter_profiles
  add column if not exists id uuid default gen_random_uuid();

update public.recruiter_profiles
set id = gen_random_uuid()
where id is null;

alter table public.recruiter_profiles
  alter column id set not null;

create unique index if not exists recruiter_profiles_id_idx
  on public.recruiter_profiles(id);

alter table public.job_applications
  add column if not exists candidate_user_id uuid references public.profiles(id) on delete set null;

update public.job_applications
set candidate_user_id = candidate_id
where candidate_user_id is null
  and candidate_id is not null;

create index if not exists job_applications_candidate_user_id_idx
  on public.job_applications(candidate_user_id);

alter table public.job_alert_subscriptions
  add column if not exists keyword text not null default '',
  add column if not exists title_preference text not null default '',
  add column if not exists location_preference text not null default '',
  add column if not exists job_type_preference text not null default '',
  add column if not exists workplace_type_preference text not null default '';

update public.job_alert_subscriptions
set keyword = coalesce(nullif(keyword, ''), keyword_query),
    title_preference = coalesce(nullif(title_preference, ''), title_query),
    location_preference = coalesce(nullif(location_preference, ''), location_query),
    job_type_preference = coalesce(nullif(job_type_preference, ''), employment_type),
    workplace_type_preference = coalesce(nullif(workplace_type_preference, ''), workplace_type);

create index if not exists job_alert_subscriptions_keyword_idx
  on public.job_alert_subscriptions(lower(keyword));

create index if not exists job_alert_subscriptions_title_preference_idx
  on public.job_alert_subscriptions(lower(title_preference));
