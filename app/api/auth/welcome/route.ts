import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email, firstName } = await req.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanFirstName = String(firstName ?? "").trim();

    if (!cleanEmail || !cleanFirstName) {
      return NextResponse.json({ error: "email and firstName are required" }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await sendWelcomeEmail(cleanEmail, cleanFirstName.slice(0, 80));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
