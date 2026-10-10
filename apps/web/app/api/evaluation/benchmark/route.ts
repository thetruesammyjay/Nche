import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../lib/auth";
import { verifySessionToken } from "../../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NCHE_API_KEY;

function authorized(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  return Boolean(verifySessionToken(cookie?.split("=").slice(1).join("=")));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(`${API_URL}/v1/evaluation/benchmark`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(API_KEY ? { "X-Nche-API-Key": API_KEY } : {}) },
      signal: controller.signal,
      cache: "no-store",
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "The evaluation service is unavailable." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
