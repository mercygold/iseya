create or replace function public.get_institution_aggregate_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_institution public.institution_profiles%rowtype;
  v_students_onboarded integer := 0;
  v_active_learners integer := 0;
  v_resume_created integer := 0;
  v_materials_improved integer := 0;
  v_linkedin_positioning integer := 0;
  v_applications_submitted integer := 0;
  v_submitted integer := 0;
  v_reviewing integer := 0;
  v_proceed integer := 0;
  v_rejected integer := 0;
  v_closed integer := 0;
  v_published_jobs_applied_to integer := 0;
  v_recruiter_responses integer := 0;
  v_remaining_seats integer;
  v_seat_usage_percentage numeric;
  v_proceed_rate numeric;
begin
  select *
    into v_institution
    from public.institution_profiles
   where user_id = auth.uid();

  if not found then
    raise exception 'institution_profile_not_found' using errcode = '42501';
  end if;

  select count(*)::integer
    into v_students_onboarded
    from public.profiles
   where institution_id = v_institution.id;

  select count(*)::integer
    into v_active_learners
    from public.profiles learner
   where learner.institution_id = v_institution.id
     and (
       exists (select 1 from public.resumes r where r.user_id = learner.id)
       or exists (select 1 from public.ai_generations ag where ag.user_id = learner.id)
       or exists (
         select 1
           from public.job_applications ja
          where coalesce(ja.candidate_user_id, ja.candidate_id) = learner.id
       )
     );

  select count(distinct learner.id)::integer
    into v_resume_created
    from public.profiles learner
    join public.resumes r on r.user_id = learner.id
   where learner.institution_id = v_institution.id;

  select count(*)::integer
    into v_materials_improved
    from public.profiles learner
   where learner.institution_id = v_institution.id
     and (
       exists (select 1 from public.resumes r where r.user_id = learner.id)
       or exists (select 1 from public.ai_generations ag where ag.user_id = learner.id)
       or exists (select 1 from public.exports e where e.user_id = learner.id)
     );

  select count(distinct learner.id)::integer
    into v_linkedin_positioning
    from public.profiles learner
    join public.ai_generations ag on ag.user_id = learner.id
   where learner.institution_id = v_institution.id
     and ag.prompt_type ilike '%linkedin%';

  with institution_applications as (
    select
      ja.id,
      ja.job_id,
      ja.status,
      jp.status as job_status
    from public.job_applications ja
    join public.profiles learner
      on learner.id = coalesce(ja.candidate_user_id, ja.candidate_id)
    left join public.job_posts jp on jp.id = ja.job_id
   where learner.institution_id = v_institution.id
  )
  select
    count(*)::integer,
    count(*) filter (where job_status <> 'closed' and status = 'submitted')::integer,
    count(*) filter (where job_status <> 'closed' and status = 'reviewing')::integer,
    count(*) filter (where job_status <> 'closed' and status = 'proceed')::integer,
    count(*) filter (where job_status <> 'closed' and status = 'rejected')::integer,
    count(*) filter (where job_status = 'closed')::integer,
    count(distinct job_id) filter (where job_status = 'published')::integer,
    count(*) filter (where status in ('reviewing', 'proceed', 'rejected'))::integer
  into
    v_applications_submitted,
    v_submitted,
    v_reviewing,
    v_proceed,
    v_rejected,
    v_closed,
    v_published_jobs_applied_to,
    v_recruiter_responses
  from institution_applications;

  if v_institution.seat_limit is not null then
    v_remaining_seats := greatest(v_institution.seat_limit - v_institution.active_seats, 0);
    v_seat_usage_percentage := case
      when v_institution.seat_limit = 0 then 0
      else round((v_institution.active_seats::numeric / v_institution.seat_limit::numeric) * 100, 1)
    end;
  end if;

  v_proceed_rate := case
    when v_applications_submitted = 0 then null
    else round((v_proceed::numeric / v_applications_submitted::numeric) * 100, 1)
  end;

  return jsonb_build_object(
    'studentsOnboarded', v_students_onboarded,
    'activeLearners', v_active_learners,
    'seatLimit', v_institution.seat_limit,
    'activeSeats', v_institution.active_seats,
    'remainingSeats', v_remaining_seats,
    'seatUsagePercentage', v_seat_usage_percentage,
    'applicationsSubmitted', v_applications_submitted,
    'materialsImproved', v_materials_improved,
    'recruiterEngagements', v_recruiter_responses,
    'careerReadiness', jsonb_build_object(
      'resumeCreatedOrImported', v_resume_created,
      'careerMaterialsCompleted', v_materials_improved,
      'applicationsSubmitted', v_applications_submitted,
      'activeJobEngagement', v_published_jobs_applied_to,
      'linkedinPositioningCompleted', v_linkedin_positioning,
      'averageReadinessScore', null
    ),
    'applicationActivity', jsonb_build_object(
      'submitted', v_submitted,
      'reviewing', v_reviewing,
      'proceed', v_proceed,
      'rejected', v_rejected,
      'closed', v_closed
    ),
    'recruiterEngagement', jsonb_build_object(
      'publishedJobsAppliedTo', v_published_jobs_applied_to,
      'recruiterResponses', v_recruiter_responses,
      'proceedRate', v_proceed_rate
    )
  );
end;
$$;

revoke all on function public.get_institution_aggregate_analytics() from public;
revoke all on function public.get_institution_aggregate_analytics() from anon;
grant execute on function public.get_institution_aggregate_analytics() to authenticated;
