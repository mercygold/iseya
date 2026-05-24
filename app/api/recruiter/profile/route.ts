import { createSupabaseServerClient } from "@/lib/supabaseServer";

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
  const industryOther = text(body.industryOther);
  const companySize = text(body.companySize);
  const hiringFocus = text(body.hiringFocus);

  console.info("[recruiter-profile] save requested", {
    userId,
    payloadKeys: Object.keys(body),
  });

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

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError) {
    console.error("[recruiter-profile] base profile lookup failed", {
      code: profileLookupError.code,
      message: profileLookupError.message,
      details: profileLookupError.details,
      hint: profileLookupError.hint,
      userId,
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  console.info("[recruiter-profile] base profile state", {
    userId,
    profileExists: Boolean(existingProfile),
  });

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
      message: profileUpsert.error.message,
      details: profileUpsert.error.details,
      hint: profileUpsert.error.hint,
      userId,
      attemptedColumns: ["id", "account_type", "full_name", "email"],
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  const { data: existingRecruiterRow, error: existingProfileError } = await supabase
    .from("recruiter_profiles")
    .select("user_id, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingProfileError) {
    console.error("[recruiter-profile] existing profile lookup failed", {
      code: existingProfileError.code,
      message: existingProfileError.message,
      details: existingProfileError.details,
      hint: existingProfileError.hint,
      userId,
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  console.info("[recruiter-profile] recruiter row state", {
    userId,
    recruiterProfileExists: Boolean(existingRecruiterRow),
  });

  const { data: existingOptionalFields, error: optionalFieldsError } = existingRecruiterRow
    ? await supabase
        .from("recruiter_profiles")
        .select("linkedin_company_url, address_line_2, postal_code, industry, industry_other, company_size")
        .eq("user_id", userId)
        .maybeSingle()
    : { data: null, error: null };

  if (optionalFieldsError) {
    console.error("[recruiter-profile] structured field lookup failed", {
      code: optionalFieldsError.code,
      message: optionalFieldsError.message,
      details: optionalFieldsError.details,
      hint: optionalFieldsError.hint,
      userId,
      attemptedColumns: [
        "linkedin_company_url",
        "address_line_2",
        "postal_code",
        "industry",
        "industry_other",
        "company_size",
      ],
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  const nextVerificationStatus =
    existingRecruiterRow?.verification_status === "verified" ? "verified" : "pending_review";

  const recruiterProfilePayload = {
    user_id: userId,
    company_name: companyName,
    recruiter_name: recruiterName,
    work_email: workEmail,
    company_website: companyWebsite,
    linkedin_company_url: optionalProfileText(
      body,
      "linkedinCompanyUrl",
      existingOptionalFields?.linkedin_company_url,
    ),
    phone_number: phoneNumber,
    address_line_1: addressLine1,
    address_line_2: optionalProfileText(body, "addressLine2", existingOptionalFields?.address_line_2),
    city,
    state_region: stateRegion,
    postal_code: optionalProfileText(body, "postalCode", existingOptionalFields?.postal_code),
    country,
    company_location: text(body.companyLocation) || [city, stateRegion, country].filter(Boolean).join(", "),
    industry: hasBodyKey(body, "industry") ? industry || null : existingOptionalFields?.industry ?? null,
    industry_other:
      industry === "Other"
        ? industryOther || existingOptionalFields?.industry_other || null
        : hasBodyKey(body, "industry")
          ? null
          : existingOptionalFields?.industry_other ?? null,
    company_size: hasBodyKey(body, "companySize")
      ? companySize || null
      : existingOptionalFields?.company_size ?? null,
    hiring_focus: hiringFocus,
    verification_status: nextVerificationStatus,
  };

  const saveResult = await supabase
    .from("recruiter_profiles")
    .upsert(recruiterProfilePayload, { onConflict: "user_id" })
    .select("*")
    .single();

  const { data, error } = saveResult;

  if (error) {
    console.error("[recruiter-profile] upsert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      attemptedColumns: Object.keys(recruiterProfilePayload),
      operation: existingRecruiterRow ? "update" : "insert",
      userId,
    });
    return Response.json({ error: saveErrorMessage }, { status: 500 });
  }

  console.info("[recruiter-profile] save succeeded", {
    userId,
    operation: existingRecruiterRow ? "update" : "insert",
  });

  return Response.json({ recruiterProfile: data });
}
