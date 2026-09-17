import { NextResponse } from "next/server";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.text();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50);
  try {
    const upstream = await fetch(`${API_URL}/v1/evaluate_action`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(request.headers.get("idempotency-key")
          ? { "Idempotency-Key": request.headers.get("idempotency-key") as string }
          : {}),
        "X-Nche-Mode": request.headers.get("x-nche-mode") ?? "Enforce",
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
    return NextResponse.json({ code: "NCHE_UNAVAILABLE", detail: "fall back to local institution rules" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
