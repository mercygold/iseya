import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import {
  chooseCanonicalRecruiterProfile,
  isCompleteRecruiterProfile,
  type RecruiterProfileRecord,
} from "@/lib/recruiterProfile";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

const recruiterAllowedUpdateStatuses = new Set(["draft", "pending_review", "closed"]);
const jobSaveErrorMessage =
  "Unable to create job post right now. Please check the required fields and try again.";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase: null, userId: "", recruiterProfile: null, contextError: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? "";
  const { data: recruiterProfiles, error: recruiterProfileError } = userId
    ? await supabase
        .from("recruiter_profiles")
        .select("id, company_name, recruiter_name, work_email, company_website, phone_number, address_line_1, city, state_region, country, hiring_focus, verification_status, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
    : { data: [], error: null };

  if (recruiterProfileError) {
    console.error("[recruiter-jobs] update context lookup failed", {
      code: recruiterProfileError.code,
      message: recruiterProfileError.message,
      details: recruiterProfileError.details,
      hint: recruiterProfileError.hint,
      userId,
    });
  }

  if ((recruiterProfiles ?? []).length > 1) {
    console.warn("[recruiter-jobs] duplicate recruiter rows found during update; using canonical row", {
      userId,
      rowCount: recruiterProfiles?.length,
    });
  }

  return {
    supabase,
    userId,
    recruiterProfile: chooseCanonicalRecruiterProfile(
      recruiterProfiles as RecruiterProfileRecord[] | null,
    ),
    contextError: recruiterProfileError,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, userId, recruiterProfile, contextError } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  if (contextError) {
    return Response.json({ error: jobSaveErrorMessage }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requestedStatus = typeof body.status === "string" ? text(body.status) : "";

  if (requestedStatus && !recruiterAllowedUpdateStatuses.has(requestedStatus)) {
    return Response.json(
      { error: "Jobs can be saved as drafts, submitted for review, or closed by recruiters." },
      { status: 400 },
    );
  }

  if (!isCompleteRecruiterProfile(recruiterProfile)) {
    return Response.json(
      { error: "Create your company profile before posting jobs." },
      { status: 403 },
    );
  }

  if (requestedStatus === "pending_review" && recruiterProfile?.verification_status !== "verified") {
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

  const { data: existingJob } = requestedStatus === "closed"
    ? await supabase
        .from("job_posts")
        .select("status, job_title")
        .eq("id", id)
        .eq("recruiter_id", userId)
        .maybeSingle()
    : { data: null };

  const update = {
    ...(typeof body.jobTitle === "string" ? { job_title: text(body.jobTitle) } : {}),
    ...(typeof body.companyName === "string" ? { company_name: text(body.companyName) } : {}),
    ...(typeof body.location === "string" ? { location: text(body.location) } : {}),
    ...(typeof body.workplaceType === "string" ? { workplace_type: text(body.workplaceType) } : {}),
    ...(typeof body.employmentType === "string" ? { employment_type: text(body.employmentType) } : {}),
    ...(typeof body.salaryRange === "string" ? { salary_range: text(body.salaryRange) || null } : {}),
    ...(typeof body.salaryCurrency === "string" ? { salary_currency: text(body.salaryCurrency) || null } : {}),
    ...(typeof body.salaryMin === "string" || typeof body.salaryMin === "number" ? { salary_min: numberOrNull(body.salaryMin) } : {}),
    ...(typeof body.salaryMax === "string" || typeof body.salaryMax === "number" ? { salary_max: numberOrNull(body.salaryMax) } : {}),
    ...(typeof body.salaryPeriod === "string" ? { salary_period: text(body.salaryPeriod) || null } : {}),
    ...(typeof body.roleSummary === "string" ? { role_summary: text(body.roleSummary) } : {}),
    ...(typeof body.responsibilities === "string" ? { responsibilities: text(body.responsibilities) } : {}),
    ...(typeof body.requirements === "string" ? { requirements: text(body.requirements) } : {}),
    ...(typeof body.skills === "string" || Array.isArray(body.skills) ? { skills: skills(body.skills) } : {}),
    ...(typeof body.applicationDeadline === "string"
      ? { application_deadline: text(body.applicationDeadline) || null }
      : {}),
    ...(typeof body.applicationUrl === "string" ? { application_url: text(body.applicationUrl) || null } : {}),
    ...(requestedStatus ? { status: requestedStatus } : {}),
  };

  const { data, error } = await supabase
    .from("job_posts")
    .update(update)
    .eq("id", id)
    .eq("recruiter_id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("[recruiter-jobs] update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      jobId: id,
    });
    return Response.json({ error: jobSaveErrorMessage }, { status: 500 });
  }

  if (requestedStatus === "closed" && existingJob?.status !== "closed") {
    const serviceRole = createSupabaseServiceRoleClient();
    if (serviceRole) {
      const { data: applications, error: applicationError } = await serviceRole
        .from("job_applications")
        .select("id, candidate_user_id, candidate_email")
        .eq("job_id", id);

      if (applicationError) {
        console.error("[recruiter-jobs] closed-job applicant notification lookup failed", {
          code: applicationError.code,
          message: applicationError.message,
          jobId: id,
        });
      } else {
        for (const application of applications ?? []) {
          await createNotification(serviceRole, {
            userId: application.candidate_user_id,
            email: application.candidate_email,
            type: "job_closed",
            title: "Job closed",
            message: `The ${existingJob?.job_title ?? "job"} opportunity has been closed.`,
            relatedJobId: id,
            relatedApplicationId: application.id,
          });
        }
      }
    }
  }

  return Response.json({ job: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { error } = await supabase
    .from("job_posts")
    .delete()
    .eq("id", id)
    .eq("recruiter_id", userId);

  if (error) {
    console.error("[recruiter-jobs] delete failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to delete job post." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
