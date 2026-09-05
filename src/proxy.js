import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";

/**
 * Gates the admin area and the voucher API.
 *
 * Runs on the Edge runtime, which is why `@/lib/adminAuth` is implemented with
 * the Web Crypto API instead of Node's `crypto`.
 *
 * This is the outer gate only. The route handlers verify the session again, so
 * a matcher mistake cannot expose a money-moving endpoint.
 */
const LOGIN_PATH = "/admin/login";

export async function proxy(req) {
  const { pathname, search } = req.nextUrl;

  // The login screen itself must stay reachable.
  if (pathname === LOGIN_PATH) return NextResponse.next();

  if (await isAuthenticatedAdmin(req)) {
    const response = NextResponse.next();
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Nicht autorisiert. Bitte melden Sie sich an." },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }

  const loginUrl = new URL(LOGIN_PATH, req.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // `/api/admin/menu/:path*` is listed explicitly rather than `/api/admin/*`,
  // because the login and logout endpoints under /api/admin must stay
  // reachable without a session.
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/gutschein/:path*",
    "/api/admin/menu",
    "/api/admin/menu/:path*",
  ],
};
