-- Require recruiter-side application access to resolve through an owned native job post.
-- Candidate and admin visibility rules remain unchanged.
drop policy if exists "job_applications_select_participants_or_admin" on public.job_applications;
create policy "job_applications_select_participants_or_admin"
  on public.job_applications for select
  using (
    auth.uid() = candidate_user_id
    or auth.uid() = candidate_id
    or exists (
      select 1
      from public.job_posts
      where job_posts.id = job_applications.job_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
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
    exists (
      select 1
      from public.job_posts
      where job_posts.id = job_applications.job_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.job_posts
      where job_posts.id = job_applications.job_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );

drop policy if exists "job_application_recruiter_notes_select_owner_or_admin"
  on public.job_application_recruiter_notes;
create policy "job_application_recruiter_notes_select_owner_or_admin"
  on public.job_application_recruiter_notes for select
  using (
    exists (
      select 1
      from public.job_applications
      join public.job_posts on job_posts.id = job_applications.job_id
      where job_applications.id = job_application_recruiter_notes.application_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
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
    exists (
      select 1
      from public.job_applications
      join public.job_posts on job_posts.id = job_applications.job_id
      where job_applications.id = job_application_recruiter_notes.application_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
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
    exists (
      select 1
      from public.job_applications
      join public.job_posts on job_posts.id = job_applications.job_id
      where job_applications.id = job_application_recruiter_notes.application_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.job_applications
      join public.job_posts on job_posts.id = job_applications.job_id
      where job_applications.id = job_application_recruiter_notes.application_id
        and job_posts.recruiter_id = auth.uid()
        and job_posts.opportunity_type <> 'curated_opportunity'
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.app_role = 'admin')
    )
  );
