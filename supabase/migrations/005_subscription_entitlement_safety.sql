alter table public.profiles
  add column if not exists subscription_plan text not null default 'free',
  add column if not exists subscription_status text not null default 'free',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists resume_download_credits integer not null default 0,
  add column if not exists optimization_credits integer not null default 0,
  add column if not exists processed_stripe_event_ids text[] not null default '{}';

create index if not exists profiles_subscription_plan_idx
  on public.profiles(subscription_plan);

create index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id);
