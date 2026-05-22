create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'university',
  email_domain text not null,
  access_code text not null,
  plan text not null default 'pro_monthly',
  seats_allowed integer not null default 0,
  seats_used integer not null default 0,
  status text not null default 'active',
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists organization_access_type text,
  add column if not exists organization_verified_at timestamptz;

alter table public.organizations enable row level security;

drop policy if exists "organizations_no_public_access" on public.organizations;
create policy "organizations_no_public_access"
  on public.organizations for select
  using (false);

create index if not exists organizations_email_domain_idx
  on public.organizations(email_domain);

create unique index if not exists organizations_email_domain_access_code_idx
  on public.organizations(email_domain, access_code);

create index if not exists organizations_status_idx
  on public.organizations(status);

create index if not exists profiles_organization_id_idx
  on public.profiles(organization_id);

insert into public.organizations (
  name,
  type,
  email_domain,
  access_code,
  plan,
  seats_allowed,
  seats_used,
  status,
  start_date,
  end_date
)
values (
  'University of California, Irvine',
  'university',
  'uci.edu',
  'UCI-CAREER-2026',
  'pro_monthly',
  250,
  0,
  'active',
  '2026-01-01',
  '2026-12-31'
)
on conflict do nothing;
