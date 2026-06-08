from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.supabase_client import get_admin_db

router = APIRouter()


class NewsletterRequest(BaseModel):
    email: EmailStr
    name: str | None = None


@router.post("")
def subscribe(body: NewsletterRequest):
    db = get_admin_db()
    email = str(body.email).strip().lower()

    existing = db.table("newsletter_subscribers").select("id").eq("email", email).limit(1).execute()
    if existing.data:
        return {"success": True, "message": "Already subscribed"}

    result = db.table("newsletter_subscribers").insert({
        "email": email,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to subscribe")

    return {"success": True}
