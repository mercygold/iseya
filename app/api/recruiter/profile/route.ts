import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecruiterProfileBody = {
  companyName?: unknown;
  recruiterName?: unknown;
  workEmail?: unknown;
  companyWebsite?: unknown;
  linkedinCompanyUrl?: unknown;
  phoneNumber?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  stateRegion?: unknown;
  postalCode?: unknown;
  country?: unknown;
  companyLocation?: unknown;
  industry?: unknown;
  companySize?: unknown;
  hiringFocus?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

async function getUserContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase: null, userId: "" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? "" };
}

export async function GET() {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const [{ data: profile }, { data: recruiterProfile, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, account_type, role, app_role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (error) {
    console.error("[recruiter-profile] fetch failed", {
      code: error.code,
      message: error.message,
    });
    return Response.json({ error: "Unable to load recruiter profile." }, { status: 500 });
  }

  return Response.json({ profile, recruiterProfile });
}

export async function PUT(request: Request) {
  const { supabase, userId } = await getUserContext();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as RecruiterProfileBody;
  const companyName = text(body.companyName);
  const recruiterName = text(body.recruiterName);
  const workEmail = text(body.workEmail);
  const companyWebsite = text(body.companyWebsite);
  const phoneNumber = text(body.phoneNumber);
  const addressLine1 = text(body.addressLine1);
  const city = text(body.city);
  const stateRegion = text(body.stateRegion);
  const country = text(body.country);
  const industry = text(body.industry);
  const companySize = text(body.companySize);
  const hiringFocus = text(body.hiringFocus);

  if (
    !companyName ||
    !recruiterName ||
    !workEmail ||
    !companyWebsite ||
    !phoneNumber ||
    !addressLine1 ||
    !city ||
    !stateRegion ||
    !country ||
    !industry ||
    !companySize ||
    !hiringFocus
  ) {
    return Response.json(
      { error: "Complete all required company profile fields before saving." },
      { status: 400 },
    );
  }

  const profileUpdate = await supabase
    .from("profiles")
    .update({ account_type: "recruiter", full_name: recruiterName, email: workEmail })
    .eq("id", userId);

  if (profileUpdate.error) {
    console.error("[recruiter-profile] profile update failed", {
      code: profileUpdate.error.code,
      message: profileUpdate.error.message,
    });
    return Response.json({ error: "Unable to update account type." }, { status: 500 });
  }

  const { data: existingRecruiterProfile } = await supabase
    .from("recruiter_profiles")
    .select("verification_status")
    .eq("user_id", userId)
    .maybeSingle();
  const nextVerificationStatus =
    existingRecruiterProfile?.verification_status === "verified" ? "verified" : "pending_review";

  const recruiterProfilePayload = {
    user_id: userId,
    company_name: companyName,
    recruiter_name: recruiterName,
    work_email: workEmail,
    company_website: companyWebsite,
    linkedin_company_url: optionalText(body.linkedinCompanyUrl) ?? null,
    phone_number: phoneNumber,
    address_line_1: addressLine1,
    address_line_2: optionalText(body.addressLine2) ?? null,
    city,
    state_region: stateRegion,
    postal_code: optionalText(body.postalCode) ?? null,
    country,
    company_location: text(body.companyLocation) || [city, stateRegion, country].filter(Boolean).join(", "),
    industry,
    company_size: companySize,
    hiring_focus: hiringFocus,
    verification_status: nextVerificationStatus,
  };

  let { data, error } = await supabase
    .from("recruiter_profiles")
    .upsert(
      recruiterProfilePayload,
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (
    error &&
    (error.code === "PGRST204" ||
      error.message.includes("linkedin_company_url") ||
      error.message.includes("phone_number"))
  ) {
    const legacyPayload = {
      user_id: recruiterProfilePayload.user_id,
      company_name: recruiterProfilePayload.company_name,
      recruiter_name: recruiterProfilePayload.recruiter_name,
      work_email: recruiterProfilePayload.work_email,
      company_website: recruiterProfilePayload.company_website,
      linkedin_company_url: recruiterProfilePayload.linkedin_company_url,
      phone_number: recruiterProfilePayload.phone_number,
      company_location: recruiterProfilePayload.company_location,
      industry: recruiterProfilePayload.industry,
      company_size: recruiterProfilePayload.company_size,
      hiring_focus: recruiterProfilePayload.hiring_focus,
      verification_status: recruiterProfilePayload.verification_status,
    };

    ({ data, error } = await supabase
      .from("recruiter_profiles")
      .upsert(legacyPayload, { onConflict: "user_id" })
      .select("*")
      .single());
  }

  if (error) {
    console.error("[recruiter-profile] upsert failed", {
      code: error.code,
      message: error.message,
    });
    return Response.json({ error: "Unable to save recruiter profile." }, { status: 500 });
  }

  return Response.json({ recruiterProfile: data });
}
