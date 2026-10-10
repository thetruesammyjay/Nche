import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../../lib/auth";
import { verifySessionToken } from "../../../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NCHE_API_KEY;

function identity(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  return verifySessionToken(cookie?.split("=").slice(1).join("="));
}

export async function GET(request: Request, { params }: { params: Promise<{ institutionRef: string }> }) {
  return forward(request, params, "GET");
}

export async function PUT(request: Request, { params }: { params: Promise<{ institutionRef: string }> }) {
  return forward(request, params, "PUT");
}

async function forward(request: Request, params: Promise<{ institutionRef: string }>, method: "GET" | "PUT") {
  const analyst = identity(request);
  if (!analyst) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });
  if (method === "PUT" && analyst.role !== "Admin") return NextResponse.json({ detail: "Administrator access required." }, { status: 403 });
  const { institutionRef } = await params;
  if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(institutionRef)) return NextResponse.json({ detail: "Invalid institution reference." }, { status: 400 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(`${API_URL}/v1/institutions/${encodeURIComponent(institutionRef)}/policy`, {
      method,
      headers: {
        "content-type": "application/json",
        "X-Actor-Ref": analyst.email,
        ...(API_KEY ? { "X-Nche-API-Key": API_KEY } : {}),
      },
      body: method === "PUT" ? await request.text() : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Institution policy service is unavailable." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
