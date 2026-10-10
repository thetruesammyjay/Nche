import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../lib/auth";
import { verifySessionToken } from "../../../../lib/session";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";

function analystEmail(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .find((part) => part.trim().startsWith(`${ANALYST_SESSION_COOKIE}=`));
  return verifySessionToken(cookie?.split("=").slice(1).join("="))?.email;
}

export async function POST(request: Request) {
  const body = await request.text();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);
  const apiKey = process.env.NCHE_API_KEY;
  const actor = analystEmail(request);
  try {
    const upstream = await fetch(`${API_URL}/v1/evaluate_action`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(request.headers.get("idempotency-key")
          ? { "Idempotency-Key": request.headers.get("idempotency-key") as string }
          : {}),
        "X-Nche-Mode": request.headers.get("x-nche-mode") ?? "Enforce",
        ...(actor ? { "X-Actor-Ref": actor } : {}),
        ...(apiKey ? { "X-Nche-API-Key": apiKey } : {}),
      },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        ...(upstream.headers.get("X-Request-ID") ? { "X-Request-ID": upstream.headers.get("X-Request-ID") as string } : {}),
        ...(upstream.headers.get("X-Nche-Latency-Ms") ? { "X-Nche-Latency-Ms": upstream.headers.get("X-Nche-Latency-Ms") as string } : {}),
      },
    });
  } catch {
    return NextResponse.json({ code: "NCHE_UNAVAILABLE", detail: "fall back to local institution rules" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
