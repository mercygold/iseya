update public.profiles
set
  resume_download_credits = 3,
  optimization_credits = 15,
  updated_at = now()
where subscription_plan = 'plus'
  and (
    resume_download_credits > 3
    or optimization_credits > 15
  );
