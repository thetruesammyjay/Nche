import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../lib/auth";
import { consumeRateLimit } from "../../../../lib/rate-limit";
import { createSessionToken, SESSION_TTL_SECONDS } from "../../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NCHE_API_KEY;

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ detail: "Enter your analyst email and password." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = consumeRateLimit(`analyst-login:${forwardedFor}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { detail: "Too many sign-in attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let upstream: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    upstream = await fetch(`${API_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(API_KEY ? { "X-Nche-API-Key": API_KEY } : {}) },
      body: JSON.stringify({ email: body.email?.trim(), password: body.password }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ detail: "The analyst service is unavailable." }, { status: 503 });
  }
  clearTimeout(timeout);

  if (!upstream.ok) {
    const detail = (await upstream.json().catch(() => null)) as { detail?: string } | null;
    return NextResponse.json({ detail: detail?.detail ?? "Those analyst credentials were not recognized." }, { status: upstream.status === 401 ? 401 : 503 });
  }

  const analyst = (await upstream.json()) as { email: string; name: string; role: string };
  const response = NextResponse.json({ analyst });
  response.cookies.set({
    name: ANALYST_SESSION_COOKIE,
    value: createSessionToken(analyst),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  return response;
}
