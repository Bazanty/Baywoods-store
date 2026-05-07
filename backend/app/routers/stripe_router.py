from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.services.stripe_service import construct_webhook_event, create_payment_intent
from app.services.supabase_client import get_admin_db

router = APIRouter()


class PaymentIntentRequest(BaseModel):
    amount: float
    currency: str = "kes"
    metadata: dict | None = None


@router.post("/payment-intent")
def payment_intent(body: PaymentIntentRequest):
    if body.amount < 50:
        raise HTTPException(status_code=400, detail="Amount too low")
    return create_payment_intent(int(body.amount), body.currency, body.metadata)


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = construct_webhook_event(payload, sig)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db = get_admin_db()
    now = datetime.now(timezone.utc).isoformat()

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        update_res = db.table("payments").update({
            "status":         "paid",
            "provider_tx_id": intent["id"],
            "paid_at":        now,
            "updated_at":     now,
        }).eq("stripe_payment_intent_id", intent["id"]).select("order_id").execute()

        if update_res.data:
            order_id = update_res.data[0].get("order_id")
            if order_id:
                db.table("orders").update({
                    "status":         "processing",
                    "payment_status": "paid",
                    "updated_at":     now,
                }).eq("id", order_id).execute()

    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        db.table("payments").update({
            "status":     "failed",
            "updated_at": now,
        }).eq("stripe_payment_intent_id", intent["id"]).execute()

    return {"received": True}
