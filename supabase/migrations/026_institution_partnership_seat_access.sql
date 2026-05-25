alter table public.institution_profiles
  add column if not exists estimated_student_coverage integer,
  add column if not exists seat_limit integer,
  add column if not exists active_seats integer not null default 0,
  add column if not exists plan_type text,
  add column if not exists auto_domain_access boolean not null default true;

alter table public.institution_profiles
  drop constraint if exists institution_profiles_estimated_coverage_check,
  add constraint institution_profiles_estimated_coverage_check
    check (estimated_student_coverage is null or estimated_student_coverage >= 0),
  drop constraint if exists institution_profiles_seat_limit_check,
  add constraint institution_profiles_seat_limit_check
    check (seat_limit is null or seat_limit >= 0),
  drop constraint if exists institution_profiles_active_seats_check,
  add constraint institution_profiles_active_seats_check
    check (active_seats >= 0);

create index if not exists institution_profiles_public_access_idx
  on public.institution_profiles(access_status, lower(student_email_domain), auto_domain_access);

create or replace function public.claim_institution_domain_seat(
  p_institution_id uuid,
  p_user_id uuid,
  p_student_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_current_institution uuid;
  v_account_type text;
  v_institution public.institution_profiles%rowtype;
begin
  v_domain := lower(split_part(trim(p_student_email), '@', 2));

  if v_domain = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_email');
  end if;

  select institution_id, account_type
    into v_current_institution, v_account_type
    from public.profiles
   where id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'profile_not_found');
  end if;

  if coalesce(v_account_type, 'candidate') <> 'candidate' then
    return jsonb_build_object('ok', false, 'reason', 'candidate_account_required');
  end if;

  if v_current_institution = p_institution_id then
    select *
      into v_institution
      from public.institution_profiles
     where id = p_institution_id;
    return jsonb_build_object(
      'ok', true,
      'alreadyLinked', true,
      'institutionName', v_institution.institution_name
    );
  end if;

  if v_current_institution is not null then
    return jsonb_build_object('ok', false, 'reason', 'already_linked');
  end if;

  select *
    into v_institution
    from public.institution_profiles
   where id = p_institution_id
     and access_status = 'active'
     and auto_domain_access = true
     and lower(student_email_domain) = v_domain
     and (access_start_date is null or access_start_date <= current_date)
     and (access_end_date is null or access_end_date >= current_date)
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_eligible');
  end if;

  if v_institution.seat_limit is not null
     and v_institution.active_seats >= v_institution.seat_limit then
    return jsonb_build_object('ok', false, 'reason', 'seat_limit_reached');
  end if;

  update public.institution_profiles
     set active_seats = active_seats + 1
   where id = v_institution.id;

  update public.profiles
     set institution_id = v_institution.id,
         organization_access_type = 'student_domain',
         organization_verified_at = now()
   where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'alreadyLinked', false,
    'institutionName', v_institution.institution_name
  );
end;
$$;

revoke all on function public.claim_institution_domain_seat(uuid, uuid, text) from public;
revoke all on function public.claim_institution_domain_seat(uuid, uuid, text) from anon;
revoke all on function public.claim_institution_domain_seat(uuid, uuid, text) from authenticated;
grant execute on function public.claim_institution_domain_seat(uuid, uuid, text) to service_role;
