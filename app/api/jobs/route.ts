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
  const now = new Date().toISOString();

  const { error: expiryError } = await supabase
    .from("job_posts")
    .update({ status: "expired" })
    .eq("status", "published")
    .neq("opportunity_type", "curated_opportunity")
    .not("expires_at", "is", null)
    .lte("expires_at", now);

  if (expiryError) {
    console.error("[jobs] job expiration update failed", {
      code: expiryError.code,
    });
  }

  let builder = supabase
    .from("job_posts")
    .select("*")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
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
    console.error("[jobs] public job query failed", { code: error.code });
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
  const nativeRecruiterIds = Array.from(
    new Set(
      publishedJobs
        .filter((job) => job.opportunity_type !== "curated_opportunity")
        .map((job) => job.recruiter_id)
        .filter(Boolean),
    ),
  );
  const { data: verifiedRecruiters, error: verifiedRecruiterError } = nativeRecruiterIds.length
    ? await supabase
        .from("recruiter_profiles")
        .select("user_id")
        .in("user_id", nativeRecruiterIds)
        .eq("verification_status", "verified")
    : { data: [], error: null };

  if (verifiedRecruiterError) {
    console.error("[jobs] verified recruiter lookup failed", {
      code: verifiedRecruiterError.code,
    });
  }

  const verifiedRecruiterIds = new Set(
    (verifiedRecruiters ?? []).map((recruiter) => recruiter.user_id),
  );
  const visiblePublishedJobs = publishedJobs.map((job) => ({
    ...job,
    recruiter_verified:
      job.opportunity_type === "verified_recruiter" ||
      (job.opportunity_type !== "curated_opportunity" &&
        verifiedRecruiterIds.has(job.recruiter_id)),
  }));
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = authClient ? await authClient.auth.getUser() : { data: { user: null } };

  if (!user) {
    return Response.json({ jobs: visiblePublishedJobs, applications: [] });
  }

  const { data: applications, error: applicationError } = await supabase
    .from("job_applications")
    .select("job_id, status, created_at")
    .or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (applicationError) {
    console.error("[jobs] candidate application status query failed", {
      code: applicationError.code,
    });
    return Response.json({ jobs: visiblePublishedJobs, applications: [] });
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
    });
  }

  const visibleIds = new Set(visiblePublishedJobs.map((job) => job.id));
  const candidateClosedJobs = (closedJobs ?? []).filter(matchesFilters).filter((job) => {
    if (visibleIds.has(job.id)) return false;
    visibleIds.add(job.id);
    return true;
  });

  return Response.json({
    jobs: [...visiblePublishedJobs, ...candidateClosedJobs],
    applications: [...applicationsByJob.values()],
  });
}
