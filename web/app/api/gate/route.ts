// Preview gate endpoint.
// POST body: { password: string, next?: string }
// On correct password: set `lc_preview_auth` cookie, return { ok: true, redirect: next || "/" }.
// On wrong password: 401 { error: "Wrong password." }.

import { NextResponse } from "next/server";

const COOKIE_NAME = "lc_preview_auth";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: Request) {
  const serverPassword = process.env.PREVIEW_PASSWORD;
  if (!serverPassword) {
    // If the gate isn't configured, auth isn't meaningful. Let them in.
    return NextResponse.json({ ok: true, redirect: "/" });
  }

  let body: { password?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length === 0) {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }

  if (body.password !== serverPassword) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  // Sanitise the next-path. Only allow same-site absolute paths starting
  // with `/` and not double-slash (which would be an open-redirect vector).
  let next = typeof body.next === "string" ? body.next : "/";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  const res = NextResponse.json({ ok: true, redirect: next });
  res.cookies.set({
    name: COOKIE_NAME,
    value: serverPassword,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
