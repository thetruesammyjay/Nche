import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../lib/auth";

const API_URL = process.env.NCHE_API_URL ?? "http://localhost:8000";

function authorized(request: Request) {
  return request.headers.get("cookie")?.split(";").some((part) => part.trim() === `${ANALYST_SESSION_COOKIE}=active`) ?? false;
}

async function forward(request: Request, method: "GET" | "POST") {
  if (!authorized(request)) return NextResponse.json({ detail: "Analyst sign-in required." }, { status: 401 });
  const upstream = await fetch(`${API_URL}/v1/institutions`, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "POST" ? await request.text() : undefined,
    cache: "no-store",
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function GET(request: Request) {
  try {
    return await forward(request, "GET");
  } catch {
    return NextResponse.json({ detail: "Institution directory is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    return await forward(request, "POST");
  } catch {
    return NextResponse.json({ detail: "Institution directory is unavailable." }, { status: 503 });
  }
}
