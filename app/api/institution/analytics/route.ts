import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: "Institution insights are temporarily unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_institution_aggregate_analytics");

  if (error) {
    console.error("[institution-analytics] aggregate query failed", {
      code: error.code,
    });
    return Response.json({ error: "Institution insights are temporarily unavailable." }, { status: 500 });
  }

  return Response.json({ analytics: data });
}
