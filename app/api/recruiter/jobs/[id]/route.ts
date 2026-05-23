import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

async function getUserId() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { supabase: null, userId: "" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? "" };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, userId } = await getUserId();

  if (!supabase || !userId) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const update = {
    ...(typeof body.jobTitle === "string" ? { job_title: text(body.jobTitle) } : {}),
    ...(typeof body.companyName === "string" ? { company_name: text(body.companyName) } : {}),
    ...(typeof body.location === "string" ? { location: text(body.location) } : {}),
    ...(typeof body.workplaceType === "string" ? { workplace_type: text(body.workplaceType) } : {}),
    ...(typeof body.employmentType === "string" ? { employment_type: text(body.employmentType) } : {}),
    ...(typeof body.salaryRange === "string" ? { salary_range: text(body.salaryRange) || null } : {}),
    ...(typeof body.roleSummary === "string" ? { role_summary: text(body.roleSummary) } : {}),
    ...(typeof body.responsibilities === "string" ? { responsibilities: text(body.responsibilities) } : {}),
    ...(typeof body.requirements === "string" ? { requirements: text(body.requirements) } : {}),
    ...(typeof body.skills === "string" || Array.isArray(body.skills) ? { skills: skills(body.skills) } : {}),
    ...(typeof body.applicationDeadline === "string"
      ? { application_deadline: text(body.applicationDeadline) || null }
      : {}),
    ...(typeof body.applicationUrl === "string" ? { application_url: text(body.applicationUrl) || null } : {}),
    ...(typeof body.status === "string" ? { status: text(body.status) } : {}),
  };

  const { data, error } = await supabase
    .from("job_posts")
    .update(update)
    .eq("id", id)
    .eq("recruiter_id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("[recruiter-jobs] update failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to update job post." }, { status: 500 });
  }

  return Response.json({ job: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, userId } = await getUserId();

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
