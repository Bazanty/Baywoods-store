import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendContactConfirmationEmail } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();
    const cleanName = String(name ?? "").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanSubject = String(subject ?? "General").trim() || "General";
    const cleanMessage = String(message ?? "").trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (cleanMessage.length > 3000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const { error } = await createSupabaseAdminClient().from("contact_messages").insert({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject.slice(0, 120),
      message: cleanMessage,
    });

    if (error) {
      console.error("Contact insert error:", error);
      if (error.code === "PGRST205") {
        return NextResponse.json(
          {
            error:
              "Contact storage is not configured. Apply the contact_messages database migration.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    await sendContactConfirmationEmail({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject.slice(0, 120),
      message: cleanMessage,
    }).catch((emailError) => {
      console.warn("Contact confirmation email failed:", emailError);
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
