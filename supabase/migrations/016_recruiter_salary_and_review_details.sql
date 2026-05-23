alter table public.job_posts
  add column if not exists salary_currency text,
  add column if not exists salary_min numeric,
  add column if not exists salary_max numeric,
  add column if not exists salary_period text;

create index if not exists recruiter_profiles_status_created_idx
  on public.recruiter_profiles(verification_status, created_at desc);
