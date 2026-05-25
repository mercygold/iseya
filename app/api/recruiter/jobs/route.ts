import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { chooseCanonicalRecruiterProfile, isCompleteRecruiterProfile } from "@/lib/recruiterProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JobBody = {
  jobTitle?: unknown;
  companyName?: unknown;
  location?: unknown;
  workplaceType?: unknown;
  employmentType?: unknown;
  salaryRange?: unknown;
  salaryCurrency?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  salaryPeriod?: unknown;
  roleSummary?: unknown;
  responsibilities?: unknown;
  requirements?: unknown;
  skills?: unknown;
  applicationDeadline?: unknown;
  applicationUrl?: unknown;
  status?: unknown;
};

const recruiterAllowedCreateStatuses = new Set(["draft", "pending_review"]);
const jobSaveErrorMessage =
  "Unable to create job post right now. Please check the required fields and try again.";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function skills(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(text).filter(Boolean).slice(0, 30);
  }

  return text(value)
    .split(/[,|\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function numberOrNull(value: unknown) {
  if (text(value) === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

async function getRecruiterContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      supabase: null,
      userId: "",
      recruiter: false,
      recruiterProfile: null,
      contextError: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  if (!userId) {
    return {
      supabase,
      userId,
      recruiter: false,
      recruiterProfile: null,
      contextError: null,
    };
  }

  const [
    { data: profile, error: profileError },
    { data: recruiterProfiles, error: recruiterProfileError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("account_type, role, app_role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("recruiter_profiles")
      .select("id, company_name, recruiter_name, work_email, company_website, phone_number, address_line_1, city, state_region, country, hiring_focus, verification_status, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const contextError = profileError ?? recruiterProfileError;

  if (contextError) {
    console.error("[recruiter-jobs] recruiter context lookup failed", {
      code: contextError.code,
      message: contextError.message,
      details: contextError.details,
      hint: contextError.hint,
      userId,
    });
  }

  if ((recruiterProfiles ?? []).length > 1) {
    console.warn("[recruiter-jobs] duplicate recruiter rows found; using canonical row", {
      userId,
      rowCount: recruiterProfiles?.length,
    });
  }

  return {
    supabase,
    userId,
    recruiter:
      profile?.account_type === "recruiter" ||
      profile?.role === "admin" ||
      profile?.app_role === "admin",
    recruiterProfile: chooseCanonicalRecruiterProfile(recruiterProfiles),
    contextError,
  };
}

export async function GET() {
  const { supabase, userId, recruiter } = await getRecruiterContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  if (!recruiter) {
    return Response.json({ error: "Recruiter account required." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("recruiter_id", userId)
    .neq("opportunity_type", "curated_opportunity")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[recruiter-jobs] list failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to load job posts." }, { status: 500 });
  }

  return Response.json({ jobs: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, userId, recruiter, recruiterProfile, contextError } =
    await getRecruiterContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  if (!recruiter) {
    return Response.json({ error: "Recruiter account required." }, { status: 403 });
  }

  if (contextError) {
    return Response.json({ error: jobSaveErrorMessage }, { status: 500 });
  }

  if (!isCompleteRecruiterProfile(recruiterProfile)) {
    return Response.json(
      { error: "Create your company profile before posting jobs." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as JobBody;
  const status = text(body.status) || "draft";

  console.info("[recruiter-jobs] create requested", {
    userId,
    status,
    payloadKeys: Object.keys(body),
    recruiterProfileExists: Boolean(recruiterProfile),
    verificationStatus: recruiterProfile?.verification_status ?? null,
  });

  if (
    !text(body.jobTitle) ||
    !text(body.companyName) ||
    !text(body.location) ||
    !text(body.workplaceType) ||
    !text(body.employmentType) ||
    !text(body.roleSummary) ||
    !text(body.responsibilities) ||
    !text(body.requirements)
  ) {
    return Response.json(
      { error: "Job title, company, location, workplace, employment type, summary, responsibilities, and requirements are required." },
      { status: 400 },
    );
  }

  if (!recruiterAllowedCreateStatuses.has(status)) {
    return Response.json({ error: "Invalid job status." }, { status: 400 });
  }

  if (status === "pending_review" && recruiterProfile?.verification_status !== "verified") {
    return Response.json(
      {
        error:
          recruiterProfile?.verification_status === "rejected"
            ? "Update your company profile before submitting jobs for review."
            : "Your company profile must be verified before submitting jobs for review.",
      },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("job_posts")
    .insert({
      recruiter_id: userId,
      opportunity_type: "recruiter_posted",
      job_title: text(body.jobTitle),
      company_name: text(body.companyName),
      location: text(body.location),
      workplace_type: text(body.workplaceType) || "remote",
      employment_type: text(body.employmentType) || "full-time",
      salary_range: text(body.salaryRange) || null,
      salary_currency: text(body.salaryCurrency) || null,
      salary_min: numberOrNull(body.salaryMin),
      salary_max: numberOrNull(body.salaryMax),
      salary_period: text(body.salaryPeriod) || null,
      role_summary: text(body.roleSummary),
      responsibilities: text(body.responsibilities),
      requirements: text(body.requirements),
      skills: skills(body.skills),
      application_deadline: text(body.applicationDeadline) || null,
      application_url: text(body.applicationUrl) || null,
      status,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[recruiter-jobs] create failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      status,
    });
    return Response.json({ error: jobSaveErrorMessage }, { status: 500 });
  }

  console.info("[recruiter-jobs] create succeeded", { userId, jobId: data.id, status });
  return Response.json({ job: data });
}
