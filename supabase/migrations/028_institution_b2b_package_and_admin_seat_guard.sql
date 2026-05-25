update public.institution_profiles
   set package_type = case package_type
     when 'Full Campus Access' then 'Campus Access'
     when 'Custom Enterprise Access' then 'Enterprise Access'
     when 'Workforce Program Access' then 'Department Access'
     else package_type
   end
 where package_type in ('Full Campus Access', 'Custom Enterprise Access', 'Workforce Program Access');

alter table public.institution_profiles
  drop constraint if exists institution_profiles_package_type_check,
  add constraint institution_profiles_package_type_check
    check (
      package_type is null
      or package_type in (
        'Pilot Access',
        'Department Access',
        'Campus Access',
        'Enterprise Access'
      )
    );

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

  select *
    into v_institution
    from public.institution_profiles
   where id = p_institution_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_eligible');
  end if;

  if v_institution.user_id = p_user_id
     or lower(v_institution.admin_email) = lower(trim(p_student_email)) then
    return jsonb_build_object('ok', false, 'reason', 'institution_admin_account');
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
    return jsonb_build_object(
      'ok', true,
      'alreadyLinked', true,
      'institutionName', v_institution.institution_name
    );
  end if;

  if v_current_institution is not null then
    return jsonb_build_object('ok', false, 'reason', 'already_linked');
  end if;

  if v_institution.access_status <> 'active'
     or v_institution.auto_domain_access <> true
     or lower(v_institution.student_email_domain) <> v_domain
     or (v_institution.access_start_date is not null and v_institution.access_start_date > current_date)
     or (v_institution.access_end_date is not null and v_institution.access_end_date < current_date) then
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
