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

const DEV_SESSION_SECRET = "nche-development-session-secret";

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeText(value: string) {
  return new TextDecoder().decode(decodeBase64Url(value));
}

async function verifySessionCookie(token: string | undefined) {
  try {
    if (!token) return false;
    const [payload, providedSignature] = token.split(".");
    if (!payload || !providedSignature) return false;
    if (process.env.NODE_ENV === "production" && !process.env.NCHE_SESSION_SECRET) return false;
    const secret = process.env.NCHE_SESSION_SECRET ?? DEV_SESSION_SECRET;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
    const provided = decodeBase64Url(providedSignature);
    if (provided.length !== expected.length) return false;
    if (!provided.every((value, index) => value === expected[index])) return false;
    const parsed = JSON.parse(decodeText(payload)) as { exp?: number; nonce?: string; email?: string; name?: string; role?: string };
    return Boolean(parsed.exp && Number.isFinite(parsed.exp) && parsed.exp > Math.floor(Date.now() / 1000) && parsed.nonce && parsed.email && parsed.name && parsed.role);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = await verifySessionCookie(request.cookies.get(ANALYST_SESSION_COOKIE)?.value);
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
