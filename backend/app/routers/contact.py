from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.supabase_client import get_admin_db

router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str | None = "General"
    message: str


@router.post("")
def contact(body: ContactRequest):
    db = get_admin_db()
    clean_name = body.name.strip()
    clean_subject = (body.subject or "General").strip() or "General"
    clean_message = body.message.strip()

    if not clean_name or not clean_message:
        raise HTTPException(status_code=400, detail="Name and message are required")
    if len(clean_message) > 3000:
        raise HTTPException(status_code=400, detail="Message is too long")

    result = db.table("contact_messages").insert({
        "name":    clean_name,
        "email":   str(body.email).lower(),
        "subject": clean_subject[:120],
        "message": clean_message,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save message")

    return {"success": True}
