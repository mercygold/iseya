import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createSupabaseServiceRoleClient();

  if (!supabase) {
    return Response.json({ jobs: [] });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const title = url.searchParams.get("title")?.trim().toLowerCase() ?? "";
  const location = url.searchParams.get("location")?.trim().toLowerCase() ?? "";
  const employmentType = url.searchParams.get("employmentType")?.trim().toLowerCase() ?? "";
  const workplace = url.searchParams.get("workplace")?.trim().toLowerCase() ?? "";

  let builder = supabase
    .from("job_posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (workplace) {
    builder = builder.eq("workplace_type", workplace);
  }

  if (employmentType) {
    builder = builder.eq("employment_type", employmentType);
  }

  const { data, error } = await builder;

  if (error) {
    console.error("[jobs] public job query failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to load jobs." }, { status: 500 });
  }

  function matchesFilters(job: NonNullable<typeof data>[number]) {
    const haystack = [
      job.job_title,
      job.company_name,
      job.location,
      job.role_summary,
      job.requirements,
      job.responsibilities,
      ...(job.skills ?? []),
    ]
      .join(" ")
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (title && !String(job.job_title ?? "").toLowerCase().includes(title)) return false;
    if (location && !String(job.location ?? "").toLowerCase().includes(location)) return false;
    if (workplace && job.workplace_type !== workplace) return false;
    if (employmentType && job.employment_type !== employmentType) return false;

    return true;
  }

  const publishedJobs = (data ?? []).filter(matchesFilters);
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = authClient ? await authClient.auth.getUser() : { data: { user: null } };

  if (!user) {
    return Response.json({ jobs: publishedJobs, applications: [] });
  }

  const { data: applications, error: applicationError } = await supabase
    .from("job_applications")
    .select("job_id, status, created_at")
    .or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (applicationError) {
    console.error("[jobs] candidate application status query failed", {
      code: applicationError.code,
      message: applicationError.message,
      userId: user.id,
    });
    return Response.json({ jobs: publishedJobs, applications: [] });
  }

  const applicationsByJob = new Map<string, { job_id: string; status: string }>();
  for (const application of applications ?? []) {
    if (!applicationsByJob.has(application.job_id)) {
      applicationsByJob.set(application.job_id, {
        job_id: application.job_id,
        status: application.status,
      });
    }
  }

  const appliedJobIds = [...applicationsByJob.keys()];
  const { data: closedJobs, error: closedJobError } = appliedJobIds.length
    ? await supabase.from("job_posts").select("*").in("id", appliedJobIds).eq("status", "closed")
    : { data: [], error: null };

  if (closedJobError) {
    console.error("[jobs] candidate closed application query failed", {
      code: closedJobError.code,
      message: closedJobError.message,
      userId: user.id,
    });
  }

  const visibleIds = new Set(publishedJobs.map((job) => job.id));
  const candidateClosedJobs = (closedJobs ?? []).filter(matchesFilters).filter((job) => {
    if (visibleIds.has(job.id)) return false;
    visibleIds.add(job.id);
    return true;
  });

  return Response.json({
    jobs: [...publishedJobs, ...candidateClosedJobs],
    applications: [...applicationsByJob.values()],
  });
}
