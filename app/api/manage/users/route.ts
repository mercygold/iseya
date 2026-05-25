import { enableInstitutionAccess } from "@/lib/featureFlags";
import { sendRecruiterVerificationEmail } from "@/lib/notificationEmails";
import { createMatchingJobAlertNotifications, createNotification } from "@/lib/notifications";
import { chooseCanonicalRecruiterProfile } from "@/lib/recruiterProfile";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import { curatedOpportunitiesStarter, type CuratedOpportunitySeed } from "@/data/curated-opportunities-starter";

const validPlans = new Set(["free", "plus", "pro_monthly", "pro_annual"]);
const validStatuses = new Set(["free", "active", "canceled", "past_due", "inactive"]);
const validInstitutionPackages = new Set([
  "Pilot Access",
  "Department Access",
  "Campus Access",
  "Enterprise Access",
]);
const validCuratedStatuses = new Set(["draft", "published", "closed"]);
const validWorkplaceTypes = new Set(["remote", "hybrid", "onsite", "not_specified"]);
const validEmploymentTypes = new Set([
  "full-time",
  "part-time",
  "contract",
  "internship",
  "temporary",
  "not_specified",
]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function textArray(value: unknown) {
  return text(value)
    .split(/[,|\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function validExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function cleanExternalUrl(value: string) {
  try {
    const url = new URL(value);
    for (const parameter of [...url.searchParams.keys()]) {
      if (
        parameter.toLowerCase().startsWith("utm_") ||
        ["fbclid", "gclid", "ref", "source"].includes(parameter.toLowerCase())
      ) {
        url.searchParams.delete(parameter);
      }
    }
    return url.toString();
  } catch {
    return value;
  }
}

function curatedFingerprint(jobTitle: string, companyName: string, externalApplyUrl: string) {
  return [
    jobTitle.trim().toLowerCase(),
    companyName.trim().toLowerCase(),
    cleanExternalUrl(externalApplyUrl).toLowerCase(),
  ].join("::");
}

function curatedSeedRow(seed: CuratedOpportunitySeed, adminUserId: string) {
  return {
    recruiter_id: adminUserId,
    job_title: seed.title.trim(),
    company_name: seed.company.trim(),
    location: seed.location.trim(),
    country: seed.country.trim() || null,
    workplace_type: seed.workplace_type,
    employment_type: seed.employment_type,
    salary_range: seed.salary_range?.trim() || null,
    role_summary: seed.description.trim(),
    responsibilities: "",
    requirements: "",
    skills: seed.skills_keywords ?? [],
    application_deadline: seed.application_deadline?.trim() || null,
    application_url: cleanExternalUrl(seed.external_apply_url.trim()),
    status: "draft",
    opportunity_type: "curated_opportunity",
    source_name: seed.source_name,
    source_description: "Sourced from active external hiring channels",
  };
}

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

function optionalAmount(value: unknown) {
  if (value === null || value === "" || typeof value === "undefined") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

function validInstitutionPackageSeatLimit(packageType: string | null, seatLimit: number | null) {
  if (!packageType) return true;
  if (seatLimit === null) return false;
  if (packageType === "Pilot Access") return seatLimit <= 500;
  if (packageType === "Department Access") return seatLimit >= 501 && seatLimit <= 2000;
  if (packageType === "Campus Access") return seatLimit >= 2001 && seatLimit <= 10000;
  return seatLimit >= 10000;
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
  let institutions: Array<{
    id: string;
    user_id: string;
    institution_name: string;
    institution_type: string;
    admin_name: string;
    admin_email: string;
    website: string;
    country: string;
    state_region: string | null;
    city: string;
    student_email_domain: string;
    access_status: string;
    access_start_date: string | null;
    access_end_date: string | null;
    access_notes: string | null;
    estimated_student_coverage: number | null;
    seat_limit: number | null;
    active_seats: number;
    package_type: string | null;
    annual_contract_value: number | null;
    price_per_student: number | null;
    discount_notes: string | null;
    auto_domain_access: boolean;
    created_at: string;
    updated_at: string;
  }> = [];
  let recruiters: Array<{
    id: string;
    user_id: string;
    company_name: string;
    recruiter_name: string;
    work_email: string;
    company_website: string | null;
    linkedin_company_url: string | null;
    phone_number: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state_region: string | null;
    postal_code: string | null;
    country: string | null;
    company_location: string | null;
    industry: string | null;
    industry_other: string | null;
    company_size: string | null;
    hiring_focus: string | null;
    verification_status: string;
    verification_notes: string | null;
    created_at: string;
    updated_at: string;
    stale_duplicate_count: number;
  }> = [];
  let jobPosts: Array<{
    id: string;
    recruiter_id: string;
    job_title: string;
    company_name: string;
    location: string;
    status: string;
    country: string | null;
    workplace_type: string;
    employment_type: string;
    salary_range: string | null;
    application_url: string | null;
    role_summary: string;
    skills: string[];
    application_deadline: string | null;
    opportunity_type: string;
    source_name: string | null;
    source_description: string | null;
    applicants_count: number;
    created_at: string;
  }> = [];

  const [
    { data: recruiterRows, error: recruiterError },
    { data: jobRows, error: jobError },
    { data: institutionRows, error: institutionError },
  ] =
    await Promise.all([
      serviceRole
        .from("recruiter_profiles")
        .select("id, user_id, company_name, recruiter_name, work_email, company_website, linkedin_company_url, phone_number, address_line_1, address_line_2, city, state_region, postal_code, country, company_location, industry, industry_other, company_size, hiring_focus, verification_status, verification_notes, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500),
      serviceRole
        .from("job_posts")
        .select("id, recruiter_id, job_title, company_name, location, country, workplace_type, employment_type, salary_range, application_url, role_summary, skills, application_deadline, status, opportunity_type, source_name, source_description, applicants_count, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      serviceRole
        .from("institution_profiles")
        .select("id, user_id, institution_name, institution_type, admin_name, admin_email, website, country, state_region, city, student_email_domain, access_status, access_start_date, access_end_date, access_notes, estimated_student_coverage, seat_limit, active_seats, package_type, annual_contract_value, price_per_student, discount_notes, auto_domain_access, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

  if (recruiterError) {
    console.error("[manage] recruiter moderation query failed", {
      code: recruiterError.code,
      message: recruiterError.message,
    });
  } else {
    const rowsByUser = new Map<string, NonNullable<typeof recruiterRows>>();

    for (const recruiter of recruiterRows ?? []) {
      rowsByUser.set(recruiter.user_id, [...(rowsByUser.get(recruiter.user_id) ?? []), recruiter]);
    }

    recruiters = Array.from(rowsByUser.values()).flatMap((rows) => {
      const active = chooseCanonicalRecruiterProfile(rows);
      return active ? [{ ...active, stale_duplicate_count: Math.max(0, rows.length - 1) }] : [];
    });
  }

  if (jobError) {
    console.error("[manage] job moderation query failed", {
      code: jobError.code,
      message: jobError.message,
    });
  } else {
    jobPosts = jobRows ?? [];
  }

  if (institutionError) {
    console.error("[manage] institution moderation query failed", {
      code: institutionError.code,
      message: institutionError.message,
    });
  } else {
    institutions = institutionRows ?? [];
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

  return Response.json({ users: safeUsers, stats, organizations, institutions, recruiters, jobPosts });
}

export async function POST(request: Request) {
  const { serviceRole, userId, admin } = await getAdminClients();

  if (!serviceRole || !userId || !admin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = text(body.action);

  if (action === "import_starter_curated_opportunities") {
    if (curatedOpportunitiesStarter.length === 0) {
      return Response.json(
        { error: "Starter curated opportunity source data has not been loaded yet." },
        { status: 409 },
      );
    }

    const invalidSeedCount = curatedOpportunitiesStarter.filter(
      (job) =>
        !job.title.trim() ||
        !job.company.trim() ||
        !validExternalUrl(job.external_apply_url.trim()),
    ).length;

    if (invalidSeedCount > 0) {
      console.error("[manage] starter curated opportunity source data is invalid", {
        invalidSeedCount,
        adminUserId: userId,
      });
      return Response.json(
        { error: "Starter opportunity data requires validation before import." },
        { status: 400 },
      );
    }

    const seedRows = curatedOpportunitiesStarter.map((job) => curatedSeedRow(job, userId));
    const { data: existingRows, error: existingError } = await serviceRole
      .from("job_posts")
      .select("job_title, company_name, application_url")
      .eq("opportunity_type", "curated_opportunity");

    if (existingError) {
      console.error("[manage] curated opportunity duplicate lookup failed", {
        code: existingError.code,
        message: existingError.message,
        adminUserId: userId,
      });
      return Response.json({ error: "Unable to import starter opportunities right now." }, { status: 500 });
    }

    const existingFingerprints = new Set(
      (existingRows ?? []).map((job) =>
        curatedFingerprint(job.job_title, job.company_name, job.application_url ?? ""),
      ),
    );
    const uniqueRows = seedRows.filter((job) => {
      const fingerprint = curatedFingerprint(job.job_title, job.company_name, job.application_url);
      if (existingFingerprints.has(fingerprint)) return false;
      existingFingerprints.add(fingerprint);
      return true;
    });

    if (uniqueRows.length > 0) {
      const { error: insertError } = await serviceRole.from("job_posts").insert(uniqueRows);

      if (insertError) {
        console.error("[manage] starter curated opportunity import failed", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          adminUserId: userId,
        });
        return Response.json({ error: "Unable to import starter opportunities right now." }, { status: 500 });
      }
    }

    return Response.json({
      imported: uniqueRows.length,
      skipped: curatedOpportunitiesStarter.length - uniqueRows.length,
    });
  }

  const curatedJobPostId = text(body.curatedJobPostId);
  const jobTitle = text(body.jobTitle);
  const companyName = text(body.companyName);
  const location = text(body.location);
  const country = text(body.country);
  const workplaceType = text(body.workplaceType).toLowerCase();
  const employmentType = text(body.employmentType).toLowerCase();
  const salaryRange = text(body.salaryRange);
  const externalApplyUrl = cleanExternalUrl(text(body.externalApplyUrl));
  const sourceName = text(body.sourceName);
  const jobDescription = text(body.jobDescription);
  const status = text(body.status).toLowerCase() || "draft";
  const applicationDeadline = text(body.applicationDeadline);

  if (
    !jobTitle ||
    !companyName ||
    !location ||
    !jobDescription ||
    !externalApplyUrl ||
    !validWorkplaceTypes.has(workplaceType) ||
    !validEmploymentTypes.has(employmentType)
  ) {
    return Response.json(
      { error: "Complete the required curated opportunity fields before saving." },
      { status: 400 },
    );
  }

  if (!validExternalUrl(externalApplyUrl)) {
    return Response.json({ error: "Enter a valid external apply URL." }, { status: 400 });
  }

  if (!validCuratedStatuses.has(status)) {
    return Response.json({ error: "Invalid curated opportunity status." }, { status: 400 });
  }

  const values = {
      recruiter_id: userId,
      job_title: jobTitle,
      company_name: companyName,
      location,
      country: country || null,
      workplace_type: workplaceType,
      employment_type: employmentType,
      salary_range: salaryRange || null,
      role_summary: jobDescription,
      responsibilities: "",
      requirements: "",
      skills: textArray(body.skillsKeywords),
      application_deadline: applicationDeadline || null,
      application_url: externalApplyUrl,
      status,
      opportunity_type: "curated_opportunity",
      source_name: sourceName || null,
      source_description: "Sourced from active external hiring channels",
    };
  const query = curatedJobPostId
    ? serviceRole
        .from("job_posts")
        .update(values)
        .eq("id", curatedJobPostId)
        .eq("opportunity_type", "curated_opportunity")
    : serviceRole.from("job_posts").insert(values);
  const { data, error } = await query
    .select("id, job_title, company_name, status, opportunity_type, created_at")
    .single();

  if (error) {
    console.error("[manage] curated opportunity save failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      adminUserId: userId,
      curatedJobPostId: curatedJobPostId || null,
    });
    return Response.json({ error: "Unable to save curated opportunity right now." }, { status: 500 });
  }

  return Response.json({ job: data });
}

export async function PATCH(request: Request) {
  const { serviceRole, admin } = await getAdminClients();

  if (!serviceRole || !admin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    userId?: unknown;
    recruiterUserId?: unknown;
    institutionProfileId?: unknown;
    jobPostId?: unknown;
    subscriptionPlan?: unknown;
    subscriptionStatus?: unknown;
    resumeDownloadCredits?: unknown;
    optimizationCredits?: unknown;
    verificationStatus?: unknown;
    jobStatus?: unknown;
    institutionSeatLimit?: unknown;
    institutionPackageType?: unknown;
    institutionAnnualContractValue?: unknown;
    institutionPricePerStudent?: unknown;
    institutionDiscountNotes?: unknown;
    institutionAccessStartDate?: unknown;
    institutionAccessEndDate?: unknown;
    institutionAutoDomainAccess?: unknown;
  };
  const userId = typeof body.userId === "string" ? body.userId : "";
  const recruiterUserId = typeof body.recruiterUserId === "string" ? body.recruiterUserId : "";
  const institutionProfileId =
    typeof body.institutionProfileId === "string" ? body.institutionProfileId : "";
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

    const { data: recruiterRows, error: lookupError } = await serviceRole
      .from("recruiter_profiles")
      .select("id, user_id, company_name, recruiter_name, work_email, company_website, phone_number, address_line_1, city, state_region, country, hiring_focus, verification_status, created_at, updated_at")
      .eq("user_id", recruiterUserId);
    const activeProfile = chooseCanonicalRecruiterProfile(recruiterRows);

    if (lookupError || !activeProfile?.id) {
      console.error("[manage] recruiter moderation lookup failed", {
        code: lookupError?.code,
        message: lookupError?.message,
        recruiterUserId,
      });
      return Response.json({ error: "Unable to update recruiter review status." }, { status: 500 });
    }

    const { error } = await serviceRole
      .from("recruiter_profiles")
      .update({ verification_status: verificationStatus })
      .eq("id", activeProfile.id);

    if (error) {
      console.error("[manage] recruiter moderation update failed", {
        code: error.code,
        message: error.message,
      });
      return Response.json({ error: "Unable to update recruiter review status." }, { status: 500 });
    }

    if (
      activeProfile.verification_status !== verificationStatus &&
      (verificationStatus === "verified" || verificationStatus === "rejected")
    ) {
      const verified = verificationStatus === "verified";
      await createNotification(serviceRole, {
        userId: recruiterUserId,
        email: activeProfile.work_email,
        type: verified ? "recruiter_verified" : "recruiter_rejected",
        title: verified ? "Company profile verified" : "Company profile needs updates",
        message: verified
          ? "Your company profile has been verified. You can now submit job posts for review on ISEYA."
          : "Your company profile needs updates before job posts can be reviewed. Please update your company information and resubmit.",
      });
      await sendRecruiterVerificationEmail({
        email: activeProfile.work_email,
        status: verificationStatus,
      });
    }

    return Response.json({ ok: true });
  }

  if (institutionProfileId) {
    const accessStatus = typeof body.verificationStatus === "string" ? body.verificationStatus : "";
    const validAccessStatuses = new Set(["pending_review", "active", "rejected", "expired"]);

    if (!validAccessStatuses.has(accessStatus)) {
      return Response.json({ error: "Invalid institution moderation update." }, { status: 400 });
    }

    const rawSeatLimit = body.institutionSeatLimit;
    const seatLimit =
      rawSeatLimit === null || rawSeatLimit === "" || typeof rawSeatLimit === "undefined"
        ? null
        : normalizeNumber(rawSeatLimit, -1);

    if (seatLimit !== null && seatLimit < 0) {
      return Response.json({ error: "Invalid institution seat limit." }, { status: 400 });
    }

    const packageType =
      typeof body.institutionPackageType === "string" && body.institutionPackageType.trim()
        ? body.institutionPackageType.trim()
        : null;
    const annualContractValue = optionalAmount(body.institutionAnnualContractValue);
    const pricePerStudent = optionalAmount(body.institutionPricePerStudent);
    const discountNotes =
      typeof body.institutionDiscountNotes === "string" && body.institutionDiscountNotes.trim()
        ? body.institutionDiscountNotes.trim()
        : null;

    if (
      (packageType !== null && !validInstitutionPackages.has(packageType)) ||
      Number.isNaN(annualContractValue) ||
      Number.isNaN(pricePerStudent) ||
      !validInstitutionPackageSeatLimit(packageType, seatLimit)
    ) {
      return Response.json({ error: "Invalid institution package details." }, { status: 400 });
    }
    const accessStartDate =
      typeof body.institutionAccessStartDate === "string" && body.institutionAccessStartDate
        ? body.institutionAccessStartDate
        : null;
    const accessEndDate =
      typeof body.institutionAccessEndDate === "string" && body.institutionAccessEndDate
        ? body.institutionAccessEndDate
        : null;
    const autoDomainAccess =
      typeof body.institutionAutoDomainAccess === "boolean"
        ? body.institutionAutoDomainAccess
        : true;

    const { error } = await serviceRole
      .from("institution_profiles")
      .update({
        access_status: accessStatus,
        seat_limit: seatLimit,
        package_type: packageType,
        annual_contract_value: annualContractValue,
        price_per_student: pricePerStudent,
        discount_notes: discountNotes,
        access_start_date: accessStartDate,
        access_end_date: accessEndDate,
        auto_domain_access: autoDomainAccess,
      })
      .eq("id", institutionProfileId);

    if (error) {
      console.error("[manage] institution moderation update failed", {
        code: error.code,
        message: error.message,
        institutionProfileId,
      });
      return Response.json({ error: "Unable to update institution access status." }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  if (jobPostId) {
    const jobStatus = typeof body.jobStatus === "string" ? body.jobStatus : "";
    const validJobStatuses = new Set(["draft", "pending_review", "published", "rejected", "closed"]);

    if (!validJobStatuses.has(jobStatus)) {
      return Response.json({ error: "Invalid job moderation update." }, { status: 400 });
    }

    const { data: jobPost, error: lookupError } = await serviceRole
      .from("job_posts")
      .select("id, recruiter_id, job_title, company_name, location, workplace_type, employment_type, skills, status")
      .eq("id", jobPostId)
      .maybeSingle();

    if (lookupError || !jobPost) {
      console.error("[manage] job moderation lookup failed", {
        code: lookupError?.code,
        message: lookupError?.message,
        jobPostId,
      });
      return Response.json({ error: "Unable to update job post status." }, { status: 500 });
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

    if (
      jobPost.status !== jobStatus &&
      (jobStatus === "published" || jobStatus === "rejected")
    ) {
      const published = jobStatus === "published";
      await createNotification(serviceRole, {
        userId: jobPost.recruiter_id,
        type: published ? "job_published" : "job_rejected",
        title: published ? "Job published" : "Job post needs updates",
        message: published
          ? `${jobPost.job_title} is now published on ISEYA.`
          : `${jobPost.job_title} was not approved for publishing.`,
        relatedJobId: jobPost.id,
      });

      if (published) {
        await createMatchingJobAlertNotifications(serviceRole, jobPost);
      }
    }

    if (jobPost.status !== jobStatus && jobStatus === "closed") {
      const { data: applications, error: applicationError } = await serviceRole
        .from("job_applications")
        .select("id, candidate_user_id, candidate_email")
        .eq("job_id", jobPost.id);

      if (applicationError) {
        console.error("[manage] closed-job applicant notification lookup failed", {
          code: applicationError.code,
          message: applicationError.message,
          jobPostId,
        });
      } else {
        for (const application of applications ?? []) {
          await createNotification(serviceRole, {
            userId: application.candidate_user_id,
            email: application.candidate_email,
            type: "job_closed",
            title: "Job closed",
            message: `The ${jobPost.job_title} opportunity has been closed.`,
            relatedJobId: jobPost.id,
            relatedApplicationId: application.id,
          });
        }
      }
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

export async function DELETE(request: Request) {
  const { serviceRole, admin } = await getAdminClients();

  if (!serviceRole || !admin) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    curatedJobPostId?: unknown;
    recruiterProfileId?: unknown;
    deletionMode?: unknown;
  };
  const curatedJobPostId =
    typeof body.curatedJobPostId === "string" ? body.curatedJobPostId : "";
  const recruiterProfileId =
    typeof body.recruiterProfileId === "string" ? body.recruiterProfileId : "";
  const deletionMode = typeof body.deletionMode === "string" ? body.deletionMode : "";

  if (curatedJobPostId) {
    const { error } = await serviceRole
      .from("job_posts")
      .delete()
      .eq("id", curatedJobPostId)
      .eq("opportunity_type", "curated_opportunity");

    if (error) {
      console.error("[manage] curated opportunity delete failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        curatedJobPostId,
      });
      return Response.json({ error: "Unable to delete curated opportunity." }, { status: 500 });
    }

    return Response.json({ ok: true });
  }

  if (!recruiterProfileId) {
    return Response.json({ error: "Invalid recruiter deletion request." }, { status: 400 });
  }

  const { data: requestedProfile, error: requestedProfileError } = await serviceRole
    .from("recruiter_profiles")
    .select("id, user_id")
    .eq("id", recruiterProfileId)
    .maybeSingle();

  if (requestedProfileError || !requestedProfile) {
    console.error("[manage] recruiter deletion lookup failed", {
      code: requestedProfileError?.code,
      message: requestedProfileError?.message,
      recruiterProfileId,
    });
    return Response.json({ error: "Unable to delete recruiter profile." }, { status: 500 });
  }

  const { data: recruiterRows, error: recruiterRowsError } = await serviceRole
    .from("recruiter_profiles")
    .select("id, user_id, company_name, recruiter_name, work_email, company_website, phone_number, address_line_1, city, state_region, country, hiring_focus, verification_status, created_at, updated_at")
    .eq("user_id", requestedProfile.user_id);
  const activeProfile = chooseCanonicalRecruiterProfile(recruiterRows);

  if (recruiterRowsError || !activeProfile?.id) {
    console.error("[manage] recruiter deletion canonical lookup failed", {
      code: recruiterRowsError?.code,
      message: recruiterRowsError?.message,
      recruiterProfileId,
    });
    return Response.json({ error: "Unable to delete recruiter profile." }, { status: 500 });
  }

  if (deletionMode !== "stale_duplicates" && deletionMode !== "profile_reset") {
    return Response.json({ error: "Invalid recruiter deletion request." }, { status: 400 });
  }

  const deleteQuery =
    deletionMode === "stale_duplicates"
      ? serviceRole
          .from("recruiter_profiles")
          .delete()
          .eq("user_id", requestedProfile.user_id)
          .neq("id", activeProfile.id)
      : serviceRole
          .from("recruiter_profiles")
          .delete()
          .eq("user_id", requestedProfile.user_id);
  const { error } = await deleteQuery;

  if (error) {
    console.error("[manage] recruiter deletion failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      recruiterProfileId,
      deletionMode,
    });
    return Response.json({ error: "Unable to delete recruiter profile." }, { status: 500 });
  }

  return Response.json({ ok: true, deletionMode });
}
