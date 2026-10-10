import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../../lib/auth";
import { verifySessionToken } from "../../../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NCHE_API_KEY;

function sessionIdentity(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  return verifySessionToken(cookie?.split("=").slice(1).join("="));
}

async function forward(request: Request, evaluationId: string, method: "GET" | "PUT") {
  const analyst = sessionIdentity(request);
  if (!analyst) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(evaluationId)) {
    return NextResponse.json({ detail: "Invalid evaluation id." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const body = method === "PUT" ? await request.text() : undefined;
    const upstream = await fetch(`${API_URL}/v1/evaluations/${encodeURIComponent(evaluationId)}/case`, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(API_KEY ? { "X-Nche-API-Key": API_KEY } : {}),
        "X-Actor-Ref": analyst.email,
      },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Evaluation service is unavailable." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = await params;
  return forward(request, evaluationId, "GET");
}

export async function PUT(request: Request, { params }: { params: Promise<{ evaluationId: string }> }) {
  const { evaluationId } = await params;
  return forward(request, evaluationId, "PUT");
}
