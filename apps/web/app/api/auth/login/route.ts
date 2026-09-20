import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE, DEMO_ANALYST } from "../../../../lib/auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ detail: "Enter your analyst email and password." }, { status: 400 });
  }

  if (body.email?.trim().toLowerCase() !== DEMO_ANALYST.email.toLowerCase() || body.password !== DEMO_ANALYST.password) {
    return NextResponse.json({ detail: "Those analyst credentials were not recognized." }, { status: 401 });
  }

  const response = NextResponse.json({ analyst: { name: DEMO_ANALYST.name, role: DEMO_ANALYST.role } });
  response.cookies.set({
    name: ANALYST_SESSION_COOKIE,
    value: "active",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
