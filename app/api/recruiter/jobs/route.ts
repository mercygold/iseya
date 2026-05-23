import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JobBody = {
  jobTitle?: unknown;
  companyName?: unknown;
  location?: unknown;
  workplaceType?: unknown;
  employmentType?: unknown;
  salaryRange?: unknown;
  roleSummary?: unknown;
  responsibilities?: unknown;
  requirements?: unknown;
  skills?: unknown;
  applicationDeadline?: unknown;
  applicationUrl?: unknown;
  status?: unknown;
};

const recruiterAllowedCreateStatuses = new Set(["draft", "pending_review"]);

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

async function getRecruiterContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase: null, userId: "", recruiter: false, recruiterProfile: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  if (!userId) {
    return { supabase, userId, recruiter: false, recruiterProfile: null };
  }

  const [{ data: profile }, { data: recruiterProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("account_type, role, app_role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("recruiter_profiles")
      .select("company_name, recruiter_name, work_email, verification_status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    supabase,
    userId,
    recruiter:
      profile?.account_type === "recruiter" ||
      profile?.role === "admin" ||
      profile?.app_role === "admin",
    recruiterProfile,
  };
}

function hasCompleteCompanyProfile(
  profile: {
    company_name: string | null;
    recruiter_name: string | null;
    work_email: string | null;
  } | null,
) {
  return Boolean(profile?.company_name && profile.recruiter_name && profile.work_email);
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[recruiter-jobs] list failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to load job posts." }, { status: 500 });
  }

  return Response.json({ jobs: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, userId, recruiter, recruiterProfile } = await getRecruiterContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  if (!recruiter) {
    return Response.json({ error: "Recruiter account required." }, { status: 403 });
  }

  if (!hasCompleteCompanyProfile(recruiterProfile)) {
    return Response.json(
      { error: "Create your company profile before posting jobs." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as JobBody;
  const status = text(body.status) || "draft";

  if (!text(body.jobTitle) || !text(body.companyName)) {
    return Response.json({ error: "Job title and company name are required." }, { status: 400 });
  }

  if (!recruiterAllowedCreateStatuses.has(status)) {
    return Response.json({ error: "Invalid job status." }, { status: 400 });
  }

  if (recruiterProfile?.verification_status === "rejected" && status !== "draft") {
    return Response.json(
      { error: "Update your company profile before submitting jobs for review." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("job_posts")
    .insert({
      recruiter_id: userId,
      job_title: text(body.jobTitle),
      company_name: text(body.companyName),
      location: text(body.location),
      workplace_type: text(body.workplaceType) || "remote",
      employment_type: text(body.employmentType) || "full-time",
      salary_range: text(body.salaryRange) || null,
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
    console.error("[recruiter-jobs] create failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to create job post." }, { status: 500 });
  }

  return Response.json({ job: data });
}
