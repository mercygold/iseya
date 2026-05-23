alter table public.recruiter_profiles
  add column if not exists address_line_1 text not null default '',
  add column if not exists address_line_2 text,
  add column if not exists city text not null default '',
  add column if not exists state_region text not null default '',
  add column if not exists postal_code text,
  add column if not exists country text not null default '';

create index if not exists recruiter_profiles_country_idx
  on public.recruiter_profiles(country);
