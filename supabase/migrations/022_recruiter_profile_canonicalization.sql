-- Consolidate legacy duplicate recruiter profiles before enforcing one profile per user.
with ranked as (
  select
    recruiter_profiles.*,
    row_number() over (
      partition by user_id
      order by
        case
          when verification_status = 'verified'
            and nullif(btrim(company_name), '') is not null
            and nullif(btrim(recruiter_name), '') is not null
            and nullif(btrim(work_email), '') is not null
            and nullif(btrim(company_website), '') is not null
            and nullif(btrim(phone_number), '') is not null
            and nullif(btrim(address_line_1), '') is not null
            and nullif(btrim(city), '') is not null
            and nullif(btrim(state_region), '') is not null
            and nullif(btrim(country), '') is not null
            and nullif(btrim(hiring_focus), '') is not null
          then 0
          else 1
        end,
        updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as row_priority
  from public.recruiter_profiles
),
merged as (
  select
    user_id,
    (array_agg(nullif(btrim(company_name), '') order by row_priority)
      filter (where nullif(btrim(company_name), '') is not null))[1] as company_name,
    (array_agg(nullif(btrim(recruiter_name), '') order by row_priority)
      filter (where nullif(btrim(recruiter_name), '') is not null))[1] as recruiter_name,
    (array_agg(nullif(btrim(work_email), '') order by row_priority)
      filter (where nullif(btrim(work_email), '') is not null))[1] as work_email,
    (array_agg(nullif(btrim(company_website), '') order by row_priority)
      filter (where nullif(btrim(company_website), '') is not null))[1] as company_website,
    (array_agg(nullif(btrim(linkedin_company_url), '') order by row_priority)
      filter (where nullif(btrim(linkedin_company_url), '') is not null))[1] as linkedin_company_url,
    (array_agg(nullif(btrim(phone_number), '') order by row_priority)
      filter (where nullif(btrim(phone_number), '') is not null))[1] as phone_number,
    (array_agg(nullif(btrim(address_line_1), '') order by row_priority)
      filter (where nullif(btrim(address_line_1), '') is not null))[1] as address_line_1,
    (array_agg(nullif(btrim(address_line_2), '') order by row_priority)
      filter (where nullif(btrim(address_line_2), '') is not null))[1] as address_line_2,
    (array_agg(nullif(btrim(city), '') order by row_priority)
      filter (where nullif(btrim(city), '') is not null))[1] as city,
    (array_agg(nullif(btrim(state_region), '') order by row_priority)
      filter (where nullif(btrim(state_region), '') is not null))[1] as state_region,
    (array_agg(nullif(btrim(postal_code), '') order by row_priority)
      filter (where nullif(btrim(postal_code), '') is not null))[1] as postal_code,
    (array_agg(nullif(btrim(country), '') order by row_priority)
      filter (where nullif(btrim(country), '') is not null))[1] as country,
    (array_agg(nullif(btrim(company_location), '') order by row_priority)
      filter (where nullif(btrim(company_location), '') is not null))[1] as company_location,
    (array_agg(nullif(btrim(industry), '') order by row_priority)
      filter (where nullif(btrim(industry), '') is not null))[1] as industry,
    (array_agg(nullif(btrim(industry_other), '') order by row_priority)
      filter (where nullif(btrim(industry_other), '') is not null))[1] as industry_other,
    (array_agg(nullif(btrim(company_size), '') order by row_priority)
      filter (where nullif(btrim(company_size), '') is not null))[1] as company_size,
    (array_agg(nullif(btrim(hiring_focus), '') order by row_priority)
      filter (where nullif(btrim(hiring_focus), '') is not null))[1] as hiring_focus,
    (array_agg(nullif(btrim(verification_notes), '') order by row_priority)
      filter (where nullif(btrim(verification_notes), '') is not null))[1] as verification_notes,
    bool_or(phone_verified) as phone_verified,
    bool_or(verification_status = 'verified') as has_verified_profile
  from ranked
  group by user_id
),
keepers as (
  select id, user_id
  from ranked
  where row_priority = 1
)
update public.recruiter_profiles as target
set
  company_name = coalesce(merged.company_name, target.company_name),
  recruiter_name = coalesce(merged.recruiter_name, target.recruiter_name),
  work_email = coalesce(merged.work_email, target.work_email),
  company_website = coalesce(merged.company_website, target.company_website),
  linkedin_company_url = coalesce(merged.linkedin_company_url, target.linkedin_company_url),
  phone_number = coalesce(merged.phone_number, target.phone_number),
  phone_verified = merged.phone_verified,
  address_line_1 = coalesce(merged.address_line_1, target.address_line_1),
  address_line_2 = coalesce(merged.address_line_2, target.address_line_2),
  city = coalesce(merged.city, target.city),
  state_region = coalesce(merged.state_region, target.state_region),
  postal_code = coalesce(merged.postal_code, target.postal_code),
  country = coalesce(merged.country, target.country),
  company_location = coalesce(merged.company_location, target.company_location),
  industry = coalesce(merged.industry, target.industry),
  industry_other = coalesce(merged.industry_other, target.industry_other),
  company_size = coalesce(merged.company_size, target.company_size),
  hiring_focus = coalesce(merged.hiring_focus, target.hiring_focus),
  verification_status = case
    when merged.has_verified_profile then 'verified'
    else target.verification_status
  end,
  verification_notes = coalesce(merged.verification_notes, target.verification_notes),
  updated_at = now()
from keepers
join merged on merged.user_id = keepers.user_id
where target.id = keepers.id;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id
      order by
        case
          when verification_status = 'verified'
            and nullif(btrim(company_name), '') is not null
            and nullif(btrim(recruiter_name), '') is not null
            and nullif(btrim(work_email), '') is not null
            and nullif(btrim(company_website), '') is not null
            and nullif(btrim(phone_number), '') is not null
            and nullif(btrim(address_line_1), '') is not null
            and nullif(btrim(city), '') is not null
            and nullif(btrim(state_region), '') is not null
            and nullif(btrim(country), '') is not null
            and nullif(btrim(hiring_focus), '') is not null
          then 0
          else 1
        end,
        updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as row_priority
  from public.recruiter_profiles
)
delete from public.recruiter_profiles
using ranked
where public.recruiter_profiles.id = ranked.id
  and ranked.row_priority > 1;

create unique index if not exists recruiter_profiles_user_id_key
  on public.recruiter_profiles(user_id);
