import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, firstName } = await req.json();
    if (!email || !firstName) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    await sendWelcomeEmail(email, firstName);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
