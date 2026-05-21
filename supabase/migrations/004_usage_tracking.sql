alter table public.profiles
  add column if not exists downloads_used integer not null default 0,
  add column if not exists optimization_credits_used integer not null default 0,
  add column if not exists saved_versions_count integer not null default 0;
