import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

async function unauthorized() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const secret = process.env.ADMIN_SECRET_TOKEN;
  return !secret || !session || session !== secret;
}

export async function POST(req: NextRequest) {
  if (await unauthorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer);

    return NextResponse.json(result);
  } catch (err: any) {
    const message = err.message ?? "Upload failed";
    console.error("[upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (await unauthorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ error: "publicId required" }, { status: 400 });
    }
    await deleteImage(publicId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
