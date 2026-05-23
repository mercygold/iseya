import { enableInstitutionAccess } from "@/lib/featureFlags";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

const validPlans = new Set(["free", "plus", "pro_monthly", "pro_annual"]);
const validStatuses = new Set(["free", "active", "canceled", "past_due", "inactive"]);

async function getAdminClients() {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!supabase || !serviceRole) {
    return { serviceRole: null, userId: null, admin: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { serviceRole, userId: null, admin: false };
  }

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("role, app_role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    serviceRole,
    userId: user.id,
    admin: profile?.role === "admin" || profile?.app_role === "admin",
  };
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : fallback;
}

export async function GET() {
  const { serviceRole, admin } = await getAdminClients();

  if (!serviceRole || !admin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: users, error } = await serviceRole
    .from("profiles")
    .select(
      "id, email, full_name, subscription_plan, subscription_status, resume_download_credits, optimization_credits, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[manage] user query failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to load users." }, { status: 500 });
  }

  const safeUsers = users ?? [];
  const stats = {
    totalUsers: safeUsers.length,
    starterUsers: safeUsers.filter((user) => !user.subscription_plan || user.subscription_plan === "free" || user.subscription_plan === "starter").length,
    plusUsers: safeUsers.filter((user) => user.subscription_plan === "plus").length,
    proMonthlyUsers: safeUsers.filter((user) => user.subscription_plan === "pro_monthly").length,
    proAnnualUsers: safeUsers.filter((user) => user.subscription_plan === "pro_annual").length,
    recentSignups: safeUsers.slice(0, 5),
    recentPaidUsers: safeUsers
      .filter((user) => user.subscription_plan && user.subscription_plan !== "free" && user.subscription_plan !== "starter")
      .slice(0, 5),
  };

  let organizations: Array<{
    id: string;
    name: string;
    type: string;
    plan: string;
    status: string;
    seats_allowed: number;
    seats_used: number;
  }> = [];
  let recruiters: Array<{
    user_id: string;
    company_name: string;
    recruiter_name: string;
    work_email: string;
    verification_status: string;
    created_at: string;
  }> = [];
  let jobPosts: Array<{
    id: string;
    recruiter_id: string;
    job_title: string;
    company_name: string;
    status: string;
    applicants_count: number;
    created_at: string;
  }> = [];

  const [{ data: recruiterRows, error: recruiterError }, { data: jobRows, error: jobError }] =
    await Promise.all([
      serviceRole
        .from("recruiter_profiles")
        .select("user_id, company_name, recruiter_name, work_email, verification_status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      serviceRole
        .from("job_posts")
        .select("id, recruiter_id, job_title, company_name, status, applicants_count, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (recruiterError) {
    console.error("[manage] recruiter moderation query failed", {
      code: recruiterError.code,
      message: recruiterError.message,
    });
  } else {
    recruiters = recruiterRows ?? [];
  }

  if (jobError) {
    console.error("[manage] job moderation query failed", {
      code: jobError.code,
      message: jobError.message,
    });
  } else {
    jobPosts = jobRows ?? [];
  }

  if (enableInstitutionAccess) {
    const { data: organizationRows, error: organizationError } = await serviceRole
      .from("organizations")
      .select("id, name, type, plan, status, seats_allowed, seats_used")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!organizationError) {
      organizations = organizationRows ?? [];
    }
  }

  return Response.json({ users: safeUsers, stats, organizations, recruiters, jobPosts });
}

export async function PATCH(request: Request) {
  const { serviceRole, admin } = await getAdminClients();

  if (!serviceRole || !admin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    userId?: unknown;
    recruiterUserId?: unknown;
    jobPostId?: unknown;
    subscriptionPlan?: unknown;
    subscriptionStatus?: unknown;
    resumeDownloadCredits?: unknown;
    optimizationCredits?: unknown;
    verificationStatus?: unknown;
    jobStatus?: unknown;
  };
  const userId = typeof body.userId === "string" ? body.userId : "";
  const recruiterUserId = typeof body.recruiterUserId === "string" ? body.recruiterUserId : "";
  const jobPostId = typeof body.jobPostId === "string" ? body.jobPostId : "";
  const subscriptionPlan = typeof body.subscriptionPlan === "string" ? body.subscriptionPlan : "";
  const subscriptionStatus = typeof body.subscriptionStatus === "string" ? body.subscriptionStatus : "";

  if (recruiterUserId) {
    const verificationStatus =
      typeof body.verificationStatus === "string" ? body.verificationStatus : "";
    const validVerificationStatuses = new Set(["pending_review", "verified", "rejected"]);

    if (!validVerificationStatuses.has(verificationStatus)) {
      return Response.json({ error: "Invalid recruiter moderation update." }, { status: 400 });
    }

    const { error } = await serviceRole
      .from("recruiter_profiles")
      .update({ verification_status: verificationStatus })
      .eq("user_id", recruiterUserId);

    if (error) {
      console.error("[manage] recruiter moderation update failed", {
        code: error.code,
        message: error.message,
      });
      return Response.json({ error: "Unable to update recruiter review status." }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  if (jobPostId) {
    const jobStatus = typeof body.jobStatus === "string" ? body.jobStatus : "";
    const validJobStatuses = new Set(["draft", "pending_review", "published", "rejected", "closed"]);

    if (!validJobStatuses.has(jobStatus)) {
      return Response.json({ error: "Invalid job moderation update." }, { status: 400 });
    }

    const { error } = await serviceRole
      .from("job_posts")
      .update({ status: jobStatus })
      .eq("id", jobPostId);

    if (error) {
      console.error("[manage] job moderation update failed", {
        code: error.code,
        message: error.message,
      });
      return Response.json({ error: "Unable to update job post status." }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  if (!userId || !validPlans.has(subscriptionPlan) || !validStatuses.has(subscriptionStatus)) {
    return Response.json({ error: "Invalid admin update." }, { status: 400 });
  }

  const { error } = await serviceRole
    .from("profiles")
    .update({
      subscription_plan: subscriptionPlan,
      subscription_status: subscriptionStatus,
      resume_download_credits: normalizeNumber(body.resumeDownloadCredits),
      optimization_credits: normalizeNumber(body.optimizationCredits),
    })
    .eq("id", userId);

  if (error) {
    console.error("[manage] user update failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to update user." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
