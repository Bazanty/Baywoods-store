from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.supabase_client import get_db

router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str | None = "General"
    message: str


@router.post("")
def contact(body: ContactRequest):
    db = get_db()
    result = db.table("contact_messages").insert({
        "name":    body.name,
        "email":   body.email,
        "subject": body.subject or "General",
        "message": body.message,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save message")

    return {"success": True}
