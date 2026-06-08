import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware-client";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];
const AUTH_ROUTES = ["/auth/signin", "/auth/signup", "/auth/forgot", "/auth/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Admin route protection (cookie-based)
  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return response;
    }
    const session = request.cookies.get("admin_session")?.value;
    const secret = process.env.ADMIN_SECRET_TOKEN;
    if (!secret || !session || session !== secret) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Supabase session refresh (keeps cookies fresh on every request)
  const supabase = createSupabaseMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  // Protect /account routes: redirect to sign in if not authenticated
  if (pathname.startsWith("/account")) {
    if (!user) {
      const signinUrl = new URL("/auth/signin", request.url);
      signinUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
