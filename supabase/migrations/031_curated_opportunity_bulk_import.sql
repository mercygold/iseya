alter table public.job_posts
  add column if not exists country text;

create index if not exists job_posts_curated_deduplication_idx
  on public.job_posts(job_title, company_name, application_url)
  where opportunity_type = 'curated_opportunity';
