alter table public.institution_profiles
  add column if not exists package_type text,
  add column if not exists annual_contract_value numeric(12, 2),
  add column if not exists price_per_student numeric(12, 2),
  add column if not exists discount_notes text;

update public.institution_profiles
   set package_type = plan_type
 where package_type is null
   and plan_type is not null;

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
    ),
  drop constraint if exists institution_profiles_annual_contract_value_check,
  add constraint institution_profiles_annual_contract_value_check
    check (annual_contract_value is null or annual_contract_value >= 0),
  drop constraint if exists institution_profiles_price_per_student_check,
  add constraint institution_profiles_price_per_student_check
    check (price_per_student is null or price_per_student >= 0);

create or replace function public.guard_institution_profile_moderation_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  if auth.uid() is null or auth.uid() <> new.user_id then
    return new;
  end if;

  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and (role = 'admin' or app_role = 'admin')
  ) into v_is_admin;

  if v_is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.access_status <> 'pending_review'
       or new.seat_limit is not null
       or new.active_seats <> 0
       or new.package_type is not null
       or new.annual_contract_value is not null
       or new.price_per_student is not null
       or new.discount_notes is not null then
      raise exception 'Institution approval and package fields are admin-managed.';
    end if;
    return new;
  end if;

  if new.access_status is distinct from old.access_status
     and new.access_status <> 'pending_review' then
    raise exception 'Institution approval status is admin-managed.';
  end if;

  if new.seat_limit is distinct from old.seat_limit
     or new.active_seats is distinct from old.active_seats
     or new.package_type is distinct from old.package_type
     or new.annual_contract_value is distinct from old.annual_contract_value
     or new.price_per_student is distinct from old.price_per_student
     or new.discount_notes is distinct from old.discount_notes
     or new.access_start_date is distinct from old.access_start_date
     or new.access_end_date is distinct from old.access_end_date
     or new.auto_domain_access is distinct from old.auto_domain_access then
    raise exception 'Institution package fields are admin-managed.';
  end if;

  return new;
end;
$$;

drop trigger if exists institution_profiles_guard_moderation_fields on public.institution_profiles;
create trigger institution_profiles_guard_moderation_fields
before insert or update on public.institution_profiles
for each row execute function public.guard_institution_profile_moderation_fields();
