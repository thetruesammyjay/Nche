import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../lib/auth";
import { verifySessionToken } from "../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NCHE_API_KEY;

function sessionIdentity(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  return verifySessionToken(cookie?.split("=").slice(1).join("="));
}

export async function GET(request: Request) {
  const analyst = sessionIdentity(request);
  if (!analyst) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const limit = incoming.get("limit");
  const institutionRef = incoming.get("institution_ref");
  const decision = incoming.get("decision");
  if (limit) query.set("limit", limit);
  if (institutionRef) query.set("institution_ref", institutionRef);
  if (decision) query.set("decision", decision);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const upstream = await fetch(`${API_URL}/v1/evaluations${query.size ? `?${query.toString()}` : ""}`, {
      headers: {
        "X-Actor-Ref": analyst.email,
        ...(API_KEY ? { "X-Nche-API-Key": API_KEY } : {}),
      },
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
