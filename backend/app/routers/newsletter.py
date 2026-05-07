from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.supabase_client import get_db

router = APIRouter()


class NewsletterRequest(BaseModel):
    email: EmailStr
    name: str | None = None


@router.post("")
def subscribe(body: NewsletterRequest):
    db = get_db()

    existing = db.table("newsletter_subscribers").select("id").eq("email", body.email).execute()
    if existing.data:
        return {"success": True, "message": "Already subscribed"}

    result = db.table("newsletter_subscribers").insert({
        "email": body.email,
        "name":  body.name,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to subscribe")

    return {"success": True}
