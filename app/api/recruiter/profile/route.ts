import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { chooseCanonicalRecruiterProfile } from "@/lib/recruiterProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveErrorMessage = "Unable to save recruiter profile right now. Please try again.";

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
  industryOther?: unknown;
  companySize?: unknown;
  hiringFocus?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function hasBodyKey(body: RecruiterProfileBody, key: keyof RecruiterProfileBody) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function optionalProfileText(
  body: RecruiterProfileBody,
  key: keyof RecruiterProfileBody,
  existingValue?: string | null,
) {
  if (!hasBodyKey(body, key)) {
    return existingValue ?? null;
  }

  return optionalText(body[key]) ?? null;
}

function sameText(left: string | null | undefined, right: string) {
  return (left ?? "").trim() === right;
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

  const [{ data: profile }, { data: recruiterProfiles, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, account_type, role, app_role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("recruiter_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  if (error) {
    console.error("[recruiter-profile] fetch failed", {
      code: error.code,
    });
    return Response.json({ error: "Unable to load recruiter profile." }, { status: 500 });
  }

  if ((recruiterProfiles ?? []).length > 1) {
    console.warn("[recruiter-profile] duplicate rows found for user; using canonical row", {
      rowCount: recruiterProfiles?.length,
    });
  }

  const recruiterProfile = chooseCanonicalRecruiterProfile(recruiterProfiles);

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
  const industryOther = text(body.industryOther);
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
    !hiringFocus
  ) {
    return Response.json(
      { error: "Complete all required company profile fields before saving." },
      { status: 400 },
    );
  }

  const { error: profileLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError) {
    console.error("[recruiter-profile] base profile lookup failed", {
      code: profileLookupError.code,
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  const profileUpsert = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        account_type: "recruiter",
        full_name: recruiterName,
        email: workEmail,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (profileUpsert.error) {
    console.error("[recruiter-profile] profile upsert failed", {
      code: profileUpsert.error.code,
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  const { data: existingRecruiterRows, error: existingProfileError } = await supabase
    .from("recruiter_profiles")
    .select(
      "id, user_id, company_name, recruiter_name, work_email, company_website, linkedin_company_url, phone_number, address_line_1, address_line_2, city, state_region, postal_code, country, industry, industry_other, company_size, hiring_focus, verification_status, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (existingProfileError) {
    console.error("[recruiter-profile] existing profile lookup failed", {
      code: existingProfileError.code,
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  if ((existingRecruiterRows ?? []).length > 1) {
    console.warn("[recruiter-profile] duplicate rows found during save; updating canonical row", {
      rowCount: existingRecruiterRows?.length,
    });
  }

  const existingRecruiterRow = chooseCanonicalRecruiterProfile(existingRecruiterRows);

  const coreFieldsChanged = Boolean(
    existingRecruiterRow &&
      (!sameText(existingRecruiterRow.company_name, companyName) ||
        !sameText(existingRecruiterRow.recruiter_name, recruiterName) ||
        !sameText(existingRecruiterRow.work_email, workEmail) ||
        !sameText(existingRecruiterRow.company_website, companyWebsite) ||
        !sameText(existingRecruiterRow.phone_number, phoneNumber) ||
        !sameText(existingRecruiterRow.address_line_1, addressLine1) ||
        !sameText(existingRecruiterRow.city, city) ||
        !sameText(existingRecruiterRow.state_region, stateRegion) ||
        !sameText(existingRecruiterRow.country, country)),
  );
  const nextVerificationStatus = !existingRecruiterRow
    ? "pending_review"
    : coreFieldsChanged
      ? "pending_review"
      : existingRecruiterRow.verification_status;

  const recruiterProfilePayload = {
    user_id: userId,
    company_name: companyName,
    recruiter_name: recruiterName,
    work_email: workEmail,
    company_website: companyWebsite,
    linkedin_company_url: optionalProfileText(
      body,
      "linkedinCompanyUrl",
      existingRecruiterRow?.linkedin_company_url,
    ),
    phone_number: phoneNumber,
    address_line_1: addressLine1,
    address_line_2: optionalProfileText(body, "addressLine2", existingRecruiterRow?.address_line_2),
    city,
    state_region: stateRegion,
    postal_code: optionalProfileText(body, "postalCode", existingRecruiterRow?.postal_code),
    country,
    company_location: text(body.companyLocation) || [city, stateRegion, country].filter(Boolean).join(", "),
    industry: hasBodyKey(body, "industry") ? industry || null : existingRecruiterRow?.industry ?? null,
    industry_other:
      industry === "Other"
        ? industryOther || existingRecruiterRow?.industry_other || null
        : hasBodyKey(body, "industry")
          ? null
          : existingRecruiterRow?.industry_other ?? null,
    company_size: hasBodyKey(body, "companySize")
      ? companySize || null
      : existingRecruiterRow?.company_size ?? null,
    hiring_focus: hiringFocus,
    verification_status: nextVerificationStatus,
  };

  const saveResult = existingRecruiterRow?.id
    ? await supabase
        .from("recruiter_profiles")
        .update(recruiterProfilePayload)
        .eq("id", existingRecruiterRow.id)
        .eq("user_id", userId)
        .select("*")
        .single()
    : await supabase
        .from("recruiter_profiles")
        .upsert(recruiterProfilePayload, { onConflict: "user_id" })
        .select("*")
        .single();

  const { data, error } = saveResult;

  if (error) {
    console.error("[recruiter-profile] upsert failed", {
      code: error.code,
      operation: existingRecruiterRow ? "update" : "insert",
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  return Response.json({
    recruiterProfile: data,
    sentForReview: Boolean(existingRecruiterRow && coreFieldsChanged),
  });
}
