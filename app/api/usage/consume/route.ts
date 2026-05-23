import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  canUseSubscriptionFeature,
  normalizeSubscriptionPlan,
  planDownloadLimit,
  planOptimizationLimit,
} from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsageKind = "optimization" | "export";

function usageKind(value: unknown): UsageKind | "" {
  return value === "optimization" || value === "export" ? value : "";
}

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : fallback;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { kind?: unknown };
  const kind = usageKind(body.kind);

  if (!kind) {
    return Response.json({ error: "Invalid usage type." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json({ error: "Usage tracking is temporarily unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Login required." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, subscription_plan, resume_download_credits, optimization_credits",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[usage] profile lookup failed", {
      code: profileError?.code,
      message: profileError?.message,
    });
    return Response.json({ error: "Unable to verify usage." }, { status: 500 });
  }

  const plan = normalizeSubscriptionPlan(profile.subscription_plan);
  const defaultExportLimit = planDownloadLimit(plan);
  const defaultOptimizationLimit = planOptimizationLimit(plan);
  const storedExportLimit = safeNumber(profile.resume_download_credits);
  const storedOptimizationLimit = safeNumber(profile.optimization_credits);
  const exportLimit = storedExportLimit > 0 ? storedExportLimit : defaultExportLimit;
  const optimizationLimit =
    storedOptimizationLimit > 0 ? storedOptimizationLimit : defaultOptimizationLimit;
  const { data: usageData, error: usageError } = await supabase
    .from("profiles")
    .select("document_exports_used, optimization_credits_used")
    .eq("id", user.id)
    .maybeSingle();

  if (usageError) {
    console.error("[usage] usage counter lookup failed", {
      code: usageError.code,
      message: usageError.message,
    });
    return Response.json({ error: "Usage counters are not configured yet." }, { status: 503 });
  }

  const downloadsUsed = safeNumber(usageData?.document_exports_used);
  const optimizationUsed = safeNumber(usageData?.optimization_credits_used);

  if (kind === "optimization") {
    if (!canUseSubscriptionFeature(plan, "aiGenerations")) {
      return Response.json({ error: "AI optimization is locked for this plan." }, { status: 403 });
    }

    if (optimizationLimit - optimizationUsed <= 0) {
      return Response.json({ error: "No optimization credits remaining." }, { status: 402 });
    }

    const nextUsed = optimizationUsed + 1;
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({ optimization_credits_used: nextUsed })
      .eq("id", user.id)
      .eq("optimization_credits_used", optimizationUsed)
      .select("optimization_credits_used")
      .maybeSingle();

    if (error || !updatedProfile) {
      console.error("[usage] optimization credit update failed", {
        code: error?.code,
        message: error?.message ?? "stale_usage_counter",
      });
      return Response.json({ error: "Unable to update usage." }, { status: error ? 500 : 409 });
    }

    return Response.json({
      optimizationCreditsUsed: nextUsed,
      optimizationCreditLimit: optimizationLimit,
      optimizationCreditsRemaining: Math.max(0, optimizationLimit - nextUsed),
      downloadsUsed,
      exportLimit,
      exportsRemaining: Math.max(0, exportLimit - downloadsUsed),
    });
  }

  if (!canUseSubscriptionFeature(plan, "exports") && downloadsUsed >= 1) {
    return Response.json({ error: "No document exports remaining." }, { status: 402 });
  }

  if (canUseSubscriptionFeature(plan, "exports") && exportLimit - downloadsUsed <= 0) {
    return Response.json({ error: "No document exports remaining." }, { status: 402 });
  }

  const nextDownloadsUsed = downloadsUsed + 1;
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ document_exports_used: nextDownloadsUsed })
    .eq("id", user.id)
    .eq("document_exports_used", downloadsUsed)
    .select("document_exports_used")
    .maybeSingle();

  if (error || !updatedProfile) {
    console.error("[usage] export usage update failed", {
      code: error?.code,
      message: error?.message ?? "stale_usage_counter",
    });
    return Response.json({ error: "Unable to update usage." }, { status: error ? 500 : 409 });
  }

  return Response.json({
    downloadsUsed: nextDownloadsUsed,
    exportLimit,
    exportsRemaining: Math.max(0, exportLimit - nextDownloadsUsed),
    optimizationCreditsUsed: optimizationUsed,
    optimizationCreditLimit: optimizationLimit,
    optimizationCreditsRemaining: Math.max(0, optimizationLimit - optimizationUsed),
  });
}
