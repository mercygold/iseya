alter table public.job_applications
  alter column candidate_id drop not null,
  add column if not exists candidate_email text;

alter table public.job_alert_subscriptions
  add column if not exists keyword_query text not null default '',
  add column if not exists workplace_type text not null default '';

create index if not exists job_applications_candidate_email_idx
  on public.job_applications(lower(candidate_email));

create index if not exists job_alert_subscriptions_keyword_query_idx
  on public.job_alert_subscriptions(lower(keyword_query));
