import time
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from app.config import get_settings
from app.schemas.mpesa import StkPushRequest, StkPushResponse, StkQueryRequest
from app.services import mpesa as mpesa_svc
from app.services.supabase_client import get_admin_db

router = APIRouter()

# In-process mock poll counter (resets on restart — fine for dev)
_mock_polls: dict[str, int] = {}


@router.post("/stkpush", response_model=StkPushResponse)
async def stk_push(body: StkPushRequest):
    settings = get_settings()
    phone = mpesa_svc.format_phone(body.phone)

    if len(phone) != 12:
        raise HTTPException(status_code=400, detail="Invalid Kenyan phone number")

    if settings.mpesa_mock or body.order_id and body.order_id.startswith("mock_"):
        mock_id = f"mock_{int(time.time())}_{body.order_id or 'dev'}"
        return StkPushResponse(
            checkout_request_id=mock_id,
            merchant_request_id="mock-merchant-req",
            customer_message="[MOCK] Enter your M-Pesa PIN to complete payment.",
        )

    result = await mpesa_svc.initiate_stk_push(
        phone=phone,
        amount=int(body.amount),
        order_id=body.order_id or str(int(time.time())),
        description=body.description,
    )

    if result.get("ResponseCode") != "0":
        raise HTTPException(status_code=422, detail=result.get("ResponseDescription", "STK push failed"))

    return StkPushResponse(
        checkout_request_id=result["CheckoutRequestID"],
        merchant_request_id=result["MerchantRequestID"],
        customer_message=result["CustomerMessage"],
    )


@router.post("/query")
async def query_push(body: StkQueryRequest):
    settings = get_settings()
    cid = body.checkout_request_id

    if settings.mpesa_mock or cid.startswith("mock_"):
        count = _mock_polls.get(cid, 0) + 1
        _mock_polls[cid] = count
        if count < 3:
            return {"result_code": None, "result_desc": "The request is being processed"}
        _mock_polls.pop(cid, None)
        return {"result_code": "0", "result_desc": "The service request is processed successfully."}

    result = await mpesa_svc.query_stk_push(cid)
    return {"result_code": result.get("ResultCode"), "result_desc": result.get("ResultDesc")}


@router.post("/callback")
async def mpesa_callback(request: Request):
    """Safaricom webhook — must always return 200 with ResultCode 0."""
    try:
        body = await request.json()
        callback = body.get("Body", {}).get("stkCallback", {})
        if not callback:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        checkout_id = callback.get("CheckoutRequestID")
        result_code = callback.get("ResultCode")
        result_desc = callback.get("ResultDesc")
        metadata_items = callback.get("CallbackMetadata", {}).get("Item", [])

        receipt = next((i["Value"] for i in metadata_items if i["Name"] == "MpesaReceiptNumber"), None)
        amount = next((i["Value"] for i in metadata_items if i["Name"] == "Amount"), None)
        phone = next((str(i["Value"]) for i in metadata_items if i["Name"] == "PhoneNumber"), None)

        payment_status = "paid" if result_code == 0 else "failed"
        db = get_admin_db()

        update_res = db.table("payments").update({
            "status":         payment_status,
            "mpesa_receipt":  receipt,
            "result_desc":    result_desc,
            "provider_tx_id": receipt,
            "metadata":       {"amount": amount, "phone": phone},
            "paid_at":        datetime.now(timezone.utc).isoformat() if result_code == 0 else None,
            "updated_at":     datetime.now(timezone.utc).isoformat(),
        }).eq("checkout_request_id", checkout_id).select("order_id").execute()

        if result_code == 0 and update_res.data:
            order_id = update_res.data[0].get("order_id")
            if order_id:
                db.table("orders").update({
                    "status":         "processing",
                    "payment_status": "paid",
                    "updated_at":     datetime.now(timezone.utc).isoformat(),
                }).eq("id", order_id).execute()

    except Exception as exc:
        print(f"M-Pesa callback error: {exc}")

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
