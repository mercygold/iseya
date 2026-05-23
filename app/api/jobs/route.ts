import { createSupabaseServiceRoleClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createSupabaseServiceRoleClient();

  if (!supabase) {
    return Response.json({ jobs: [] });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const title = url.searchParams.get("title")?.trim().toLowerCase() ?? "";
  const location = url.searchParams.get("location")?.trim().toLowerCase() ?? "";
  const employmentType = url.searchParams.get("employmentType")?.trim().toLowerCase() ?? "";
  const workplace = url.searchParams.get("workplace")?.trim().toLowerCase() ?? "";

  let builder = supabase
    .from("job_posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (workplace) {
    builder = builder.eq("workplace_type", workplace);
  }

  if (employmentType) {
    builder = builder.eq("employment_type", employmentType);
  }

  const { data, error } = await builder;

  if (error) {
    console.error("[jobs] public job query failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to load jobs." }, { status: 500 });
  }

  const jobs = (data ?? []).filter((job) => {
    const haystack = [
      job.job_title,
      job.company_name,
      job.location,
      job.role_summary,
      job.requirements,
      job.responsibilities,
      ...(job.skills ?? []),
    ]
      .join(" ")
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (title && !String(job.job_title ?? "").toLowerCase().includes(title)) return false;
    if (location && !String(job.location ?? "").toLowerCase().includes(location)) return false;

    return true;
  });

  return Response.json({ jobs });
}
