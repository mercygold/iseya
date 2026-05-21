alter table public.profiles
  add column if not exists resume_download_credits integer not null default 0,
  add column if not exists optimization_credits integer not null default 0,
  add column if not exists processed_stripe_event_ids text[] not null default '{}';
