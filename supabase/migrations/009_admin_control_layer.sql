alter table public.profiles
  add column if not exists role text,
  add column if not exists app_role text;

create index if not exists profiles_role_idx
  on public.profiles(role);

create index if not exists profiles_app_role_idx
  on public.profiles(app_role);
