create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_role text,
  content_json jsonb not null default '{}'::jsonb,
  template text,
  theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  version_name text not null,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  export_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free',
  status text not null default 'inactive',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  prompt_type text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger resumes_set_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.exports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_generations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
  on public.resumes for delete
  using (auth.uid() = user_id);

drop policy if exists "resume_versions_select_own" on public.resume_versions;
create policy "resume_versions_select_own"
  on public.resume_versions for select
  using (
    exists (
      select 1 from public.resumes
      where public.resumes.id = public.resume_versions.resume_id
        and public.resumes.user_id = auth.uid()
    )
  );

drop policy if exists "resume_versions_insert_own" on public.resume_versions;
create policy "resume_versions_insert_own"
  on public.resume_versions for insert
  with check (
    exists (
      select 1 from public.resumes
      where public.resumes.id = public.resume_versions.resume_id
        and public.resumes.user_id = auth.uid()
    )
  );

drop policy if exists "resume_versions_update_own" on public.resume_versions;
create policy "resume_versions_update_own"
  on public.resume_versions for update
  using (
    exists (
      select 1 from public.resumes
      where public.resumes.id = public.resume_versions.resume_id
        and public.resumes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.resumes
      where public.resumes.id = public.resume_versions.resume_id
        and public.resumes.user_id = auth.uid()
    )
  );

drop policy if exists "resume_versions_delete_own" on public.resume_versions;
create policy "resume_versions_delete_own"
  on public.resume_versions for delete
  using (
    exists (
      select 1 from public.resumes
      where public.resumes.id = public.resume_versions.resume_id
        and public.resumes.user_id = auth.uid()
    )
  );

drop policy if exists "exports_manage_own" on public.exports;
create policy "exports_manage_own"
  on public.exports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_generations_manage_own" on public.ai_generations;
create policy "ai_generations_manage_own"
  on public.ai_generations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists profiles_email_idx
  on public.profiles(email);

create index if not exists resumes_user_updated_idx
  on public.resumes(user_id, updated_at desc);

create index if not exists resume_versions_resume_created_idx
  on public.resume_versions(resume_id, created_at desc);

create index if not exists exports_user_created_idx
  on public.exports(user_id, created_at desc);

create index if not exists subscriptions_user_idx
  on public.subscriptions(user_id);

create index if not exists ai_generations_user_created_idx
  on public.ai_generations(user_id, created_at desc);

insert into storage.buckets (id, name, public)
values
  ('resumes', 'resumes', false),
  ('exports', 'exports', false),
  ('profile-images', 'profile-images', false)
on conflict (id) do nothing;

drop policy if exists "resumes_bucket_own_files" on storage.objects;
create policy "resumes_bucket_own_files"
  on storage.objects for all
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "exports_bucket_own_files" on storage.objects;
create policy "exports_bucket_own_files"
  on storage.objects for all
  using (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "profile_images_bucket_own_files" on storage.objects;
create policy "profile_images_bucket_own_files"
  on storage.objects for all
  using (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
