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

  const { data, error } = await builder;

  if (error) {
    console.error("[jobs] public job query failed", { code: error.code, message: error.message });
    return Response.json({ error: "Unable to load jobs." }, { status: 500 });
  }

  const jobs = query
    ? (data ?? []).filter((job) =>
        [
          job.job_title,
          job.company_name,
          job.location,
          job.role_summary,
          ...(job.skills ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : data ?? [];

  return Response.json({ jobs });
}
