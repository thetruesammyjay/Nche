import { NextResponse } from "next/server";
import { ANALYST_SESSION_COOKIE } from "../../../../lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: ANALYST_SESSION_COOKIE, value: "", maxAge: 0, path: "/" });
  return response;
}
