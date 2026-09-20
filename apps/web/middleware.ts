import { NextRequest, NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE, isSafeRedirect } from "./lib/auth";

const protectedPrefixes = [
  "/overview",
  "/alerts",
  "/investigations",
  "/beneficiaries",
  "/evaluation",
  "/settings",
  "/institutions",
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = request.cookies.has(ANALYST_SESSION_COOKIE);
  const protectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (pathname === "/login" && authenticated) {
    const next = request.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(isSafeRedirect(next) ? next : "/overview", request.url));
  }

  if (protectedRoute && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|Nche.png|Nche-Icon.png).*)"],
};
