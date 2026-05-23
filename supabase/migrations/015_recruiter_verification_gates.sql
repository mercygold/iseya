alter table public.recruiter_profiles
  add column if not exists linkedin_company_url text,
  add column if not exists phone_number text not null default '',
  add column if not exists phone_verified boolean not null default false,
  add column if not exists verification_notes text;

alter table public.job_posts
  alter column status set default 'draft';

create index if not exists job_posts_pending_review_idx
  on public.job_posts(status, created_at desc)
  where status = 'pending_review';
