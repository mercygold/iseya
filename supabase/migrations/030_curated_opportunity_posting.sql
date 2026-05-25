alter table public.job_posts
  add column if not exists opportunity_type text not null default 'recruiter_posted',
  add column if not exists source_name text,
  add column if not exists source_description text;

update public.job_posts
set opportunity_type = 'recruiter_posted'
where opportunity_type is null
   or opportunity_type not in (
     'curated_opportunity',
     'recruiter_posted',
     'verified_recruiter',
     'direct_employer'
   );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'job_posts_opportunity_type_check'
      and conrelid = 'public.job_posts'::regclass
  ) then
    alter table public.job_posts
      add constraint job_posts_opportunity_type_check
      check (
        opportunity_type in (
          'curated_opportunity',
          'recruiter_posted',
          'verified_recruiter',
          'direct_employer'
        )
      );
  end if;
end $$;

create index if not exists job_posts_opportunity_type_status_created_idx
  on public.job_posts(opportunity_type, status, created_at desc);
