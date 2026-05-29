import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabaseServer";
import curatedOpportunitiesData from "@/data/created-opportunities.data.json";
import type { CuratedOpportunitySeed } from "@/data/curated-opportunities-starter";
import {
  addCuratedOpportunityToDuplicateIndex,
  createCuratedOpportunityDuplicateIndex,
  findCuratedOpportunityDuplicate,
  normalizeCuratedOpportunityText,
} from "@/lib/curatedOpportunityDuplicatePrevention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const curatedOpportunities = curatedOpportunitiesData as readonly CuratedOpportunitySeed[];

function normalizeOption(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

  if (normalized === "full time") return "full-time";
  if (normalized === "part time") return "part-time";
  if (normalized === "not specified") return "not_specified";
  if (normalized === "on site" || normalized === "onsite") return "onsite";

  return normalized.replace(/\s+/g, "_");
}

function validDate(value: string | null | undefined) {
  if (!value) return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function curatedSeedDate(seed: CuratedOpportunitySeed, index: number) {
  return (
    validDate(seed.created_at) ||
    validDate(seed.imported_at) ||
    validDate(seed.date_added) ||
    new Date(Date.UTC(2026, 4, 29, 0, 0, index)).toISOString()
  );
}

function curatedSeedApplyUrl(seed: CuratedOpportunitySeed) {
  return seed.apply_url ?? seed.external_apply_url ?? "";
}

function curatedSeedToJob(seed: CuratedOpportunitySeed, index: number) {
  const applyUrl = curatedSeedApplyUrl(seed);
  const createdAt = curatedSeedDate(seed, index);
  const requirements = Array.isArray(seed.requirements)
    ? seed.requirements.join("\n")
    : seed.requirements ?? "";
  const skills = seed.skills_keywords ?? seed.skills ?? [];

  return {
    id: `curated-${normalizeCuratedOpportunityText(`${seed.title}-${seed.company}-${applyUrl}`)}`,
    recruiter_id: "curated_opportunity",
    job_title: seed.title,
    company_name: seed.company,
    location: seed.location,
    country: seed.country,
    workplace_type: normalizeOption(seed.workplace_type ?? seed.work_mode ?? seed.remote_type),
    employment_type: normalizeOption(seed.employment_type),
    salary_range: seed.salary_range ?? seed.salary ?? null,
    salary_currency: null,
    salary_min: null,
    salary_max: null,
    salary_period: null,
    role_summary: seed.description,
    responsibilities: "",
    requirements,
    skills,
    application_deadline: seed.application_deadline || null,
    application_url: applyUrl,
    status: "published",
    opportunity_type: "curated_opportunity",
    source_name: seed.source_name ?? seed.source_type ?? "curated_opportunity",
    source_type: seed.source_type ?? "curated_opportunity",
    source_description: seed.source_description,
    applicants_count: 0,
    published_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
    imported_at: seed.imported_at ?? createdAt,
    date_added: seed.date_added ?? createdAt.slice(0, 10),
    expires_at: null,
    sponsorship_status: seed.sponsorship_status ?? null,
  };
}

function mergePublishedSeedJobs<T extends { job_title: string; company_name: string; country?: string | null; application_url?: string | null }>(
  supabaseJobs: readonly T[],
) {
  const duplicateIndex = createCuratedOpportunityDuplicateIndex(
    supabaseJobs.map((job) => ({
      job_title: job.job_title,
      company_name: job.company_name,
      country: job.country,
      application_url: job.application_url,
    })),
  );
  const seedJobs = [];

  for (const [index, seed] of curatedOpportunities.entries()) {
    if (seed.status !== "published") continue;

    const candidate = {
      title: seed.title,
      company: seed.company,
      country: seed.country,
      external_apply_url: curatedSeedApplyUrl(seed),
    };
    const duplicateReason = findCuratedOpportunityDuplicate(duplicateIndex, candidate);
    if (duplicateReason) continue;

    addCuratedOpportunityToDuplicateIndex(duplicateIndex, candidate);
    seedJobs.push(curatedSeedToJob(seed, index));
  }

  return [...supabaseJobs, ...seedJobs];
}

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

  const publishedJobs = mergePublishedSeedJobs(data ?? []).filter(matchesFilters);
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
