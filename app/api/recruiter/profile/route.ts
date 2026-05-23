import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecruiterProfileBody = {
  companyName?: unknown;
  recruiterName?: unknown;
  workEmail?: unknown;
  companyWebsite?: unknown;
  companyLocation?: unknown;
  industry?: unknown;
  companySize?: unknown;
  hiringFocus?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

  if (!companyName || !recruiterName || !workEmail) {
    return Response.json(
      { error: "Company name, recruiter name, and work email are required." },
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

  const { data, error } = await supabase
    .from("recruiter_profiles")
    .upsert(
      {
        user_id: userId,
        company_name: companyName,
        recruiter_name: recruiterName,
        work_email: workEmail,
        company_website: text(body.companyWebsite) || null,
        company_location: text(body.companyLocation) || null,
        industry: text(body.industry) || null,
        company_size: text(body.companySize) || null,
        hiring_focus: text(body.hiringFocus) || null,
        verification_status: "pending_review",
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    console.error("[recruiter-profile] upsert failed", {
      code: error.code,
      message: error.message,
    });
    return Response.json({ error: "Unable to save recruiter profile." }, { status: 500 });
  }

  return Response.json({ recruiterProfile: data });
}
