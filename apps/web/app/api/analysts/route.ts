import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../lib/auth";
import { verifySessionToken } from "../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NCHE_API_KEY;

function identity(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  return verifySessionToken(cookie?.split("=").slice(1).join("="));
}

async function forward(request: Request, method: "GET" | "POST") {
  const analyst = identity(request);
  if (!analyst) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });
  if (analyst.role !== "Admin") return NextResponse.json({ detail: "Administrator access required." }, { status: 403 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(`${API_URL}/v1/auth/analysts`, {
      method,
      headers: {
        "content-type": "application/json",
        "X-Actor-Ref": analyst.email,
        ...(API_KEY ? { "X-Nche-API-Key": API_KEY } : {}),
      },
      body: method === "POST" ? await request.text() : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  try {
    return await forward(request, "GET");
  } catch {
    return NextResponse.json({ detail: "Analyst directory is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    return await forward(request, "POST");
  } catch {
    return NextResponse.json({ detail: "Analyst directory is unavailable." }, { status: 503 });
  }
}
