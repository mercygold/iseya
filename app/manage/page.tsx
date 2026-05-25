import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseServer";
import ManageDashboard from "./ManageDashboard";
import DashboardNavLink from "@/components/DashboardNavLink";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();

  if (!supabase || !serviceRole) {
    redirect("/workspace");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/manage");
  }

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("role, app_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.app_role !== "admin") {
    redirect("/workspace");
  }
}

export default async function ManagePage() {
  await assertAdmin();

  return (
    <main className="min-h-screen bg-[var(--iseya-soft-bg)] text-[var(--iseya-text)]">
      <header className="iseya-header text-white">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="inline-flex w-fit items-center">
            <Image
              src="/brand/iseya-logo2.png"
              alt="ISEYA"
              width={240}
              height={120}
              className="h-auto w-[150px] object-contain sm:w-[220px]"
              priority
            />
          </Link>
          <nav className="iseya-dashboard-nav text-sm font-semibold">
            <DashboardNavLink href="/manage">
              Manage
            </DashboardNavLink>
            <DashboardNavLink href="/workspace">
              Workspace
            </DashboardNavLink>
            <DashboardNavLink href="/account">
              My Account
            </DashboardNavLink>
          </nav>
        </div>
      </header>

      <section className="px-5 py-8 sm:px-8 sm:py-11">
        <div className="mx-auto max-w-[92rem]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--iseya-gold)]">
              Private Control Layer
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--iseya-navy)] sm:text-4xl">
              ISEYA Manage
            </h1>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Monitor users, plans, payments, and institutional pilots from a private admin workspace.
            </p>
          </div>

          <ManageDashboard />
        </div>
      </section>
    </main>
  );
}
