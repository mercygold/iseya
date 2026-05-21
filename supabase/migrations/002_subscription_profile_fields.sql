alter table public.profiles
  add column if not exists subscription_status text not null default 'free',
  add column if not exists subscription_plan text not null default 'free',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_subscription_plan_idx
  on public.profiles(subscription_plan);

create index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    subscription_status,
    subscription_plan
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'free',
    'free'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;
