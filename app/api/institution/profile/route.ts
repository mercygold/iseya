import { normalizeStudentEmailDomain } from "@/lib/institutionAccess";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validTypes = new Set([
  "University",
  "College",
  "Bootcamp",
  "Career Program",
  "Workforce Development",
  "Other",
]);
const saveError = "Unable to save institution profile right now. Please try again.";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function context() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, userId: "" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? "" };
}

export async function GET() {
  const { supabase, userId } = await context();
  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("institution_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[institution-profile] fetch failed", {
      code: error.code,
      message: error.message,
      userId,
    });
    return Response.json({ error: "Unable to load institution profile." }, { status: 500 });
  }

  return Response.json({ institutionProfile: data });
}

export async function PUT(request: Request) {
  const { supabase, userId } = await context();
  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const institutionName = text(body.institutionName);
  const institutionType = text(body.institutionType);
  const adminName = text(body.adminName);
  const adminEmail = text(body.adminEmail).toLowerCase();
  const website = text(body.website);
  const country = text(body.country);
  const city = text(body.city);
  const studentEmailDomain = normalizeStudentEmailDomain(text(body.studentEmailDomain));
  const estimatedStudentCoverage = Number(body.estimatedStudentCoverage);

  if (
    !institutionName ||
    !validTypes.has(institutionType) ||
    !adminName ||
    !adminEmail ||
    !website ||
    !country ||
    !city ||
    !studentEmailDomain ||
    !Number.isInteger(estimatedStudentCoverage) ||
    estimatedStudentCoverage < 1
  ) {
    return Response.json(
      { error: "Complete all required partnership request fields before submitting." },
      { status: 400 },
    );
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("institution_profiles")
    .select("institution_name, admin_email, website, student_email_domain, access_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingProfileError) {
    console.error("[institution-profile] current profile lookup failed", {
      code: existingProfileError.code,
      message: existingProfileError.message,
      userId,
    });
    return Response.json({ error: saveError }, { status: 500 });
  }

  const reviewRequired = Boolean(
    existingProfile &&
      (existingProfile.institution_name !== institutionName ||
        existingProfile.admin_email !== adminEmail ||
        existingProfile.website !== website ||
        existingProfile.student_email_domain !== studentEmailDomain),
  );

  const { error: baseProfileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      account_type: "institution",
      full_name: adminName,
      email: adminEmail,
    },
    { onConflict: "id" },
  );

  if (baseProfileError) {
    console.error("[institution-profile] account update failed", {
      code: baseProfileError.code,
      message: baseProfileError.message,
      userId,
    });
    return Response.json({ error: saveError }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("institution_profiles")
    .upsert(
      {
        user_id: userId,
        institution_name: institutionName,
        institution_type: institutionType,
        admin_name: adminName,
        admin_email: adminEmail,
        website,
        country,
        state_region: text(body.stateRegion) || null,
        city,
        student_email_domain: studentEmailDomain,
        estimated_student_coverage: estimatedStudentCoverage,
        access_notes: text(body.accessNotes) || null,
        ...(reviewRequired ? { access_status: "pending_review" } : {}),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    console.error("[institution-profile] save failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
    });
    return Response.json({ error: saveError }, { status: 500 });
  }

  return Response.json({ institutionProfile: data, reviewRequired });
}
