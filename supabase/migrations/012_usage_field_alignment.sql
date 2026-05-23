alter table public.profiles
  add column if not exists document_exports_used integer not null default 0,
  add column if not exists optimization_credits_used integer not null default 0,
  add column if not exists saved_versions_count integer not null default 0;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'downloads_used'
  ) then
    execute 'update public.profiles set document_exports_used = greatest(document_exports_used, downloads_used)';
  end if;
end $$;
