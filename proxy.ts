import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfigStatus } from "./lib/supabaseConfig";

const protectedRoutes = [
  "/dashboard",
  "/account",
  "/workspace",
  "/applications",
  "/manage",
  "/admin",
  "/recruiter",
  "/recruiters/dashboard",
  "/recruiters/onboarding",
  "/recruiters/jobs",
  "/institutions/dashboard",
  "/institutions/onboarding",
];
const authRoutes = ["/login", "/signup"];

function safeInternalRedirect(request: NextRequest, fallback: string) {
  const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");

  if (!redirectedFrom || !redirectedFrom.startsWith("/") || redirectedFrom.startsWith("//")) {
    return new URL(fallback, request.url);
  }

  return new URL(redirectedFrom, request.url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const config = getSupabasePublicConfigStatus();

  if (!config.ok) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.config.url, config.config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(safeInternalRedirect(request, "/workspace"));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/account",
    "/workspace/:path*",
    "/applications/:path*",
    "/applications",
    "/manage/:path*",
    "/manage",
    "/admin/:path*",
    "/admin",
    "/recruiter/:path*",
    "/recruiter",
    "/recruiters/dashboard/:path*",
    "/recruiters/dashboard",
    "/recruiters/onboarding/:path*",
    "/recruiters/onboarding",
    "/recruiters/jobs/:path*",
    "/recruiters/jobs",
    "/institutions/dashboard/:path*",
    "/institutions/dashboard",
    "/institutions/onboarding/:path*",
    "/institutions/onboarding",
    "/login",
    "/signup",
  ],
};
