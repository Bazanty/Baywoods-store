import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const secretToken   = process.env.ADMIN_SECRET_TOKEN;

  if (!adminPassword || !secretToken) {
    return NextResponse.json({ error: "Auth not configured." }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, secretToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
