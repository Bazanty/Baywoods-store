from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import get_settings
from app.deps import require_admin
from app.services.supabase_client import get_admin_db

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


class AdminLoginRequest(BaseModel):
    password: str


@router.post("/auth/login")
def admin_login(body: AdminLoginRequest, response: Response):
    settings = get_settings()
    if not settings.admin_password or body.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Return the admin secret token — frontend stores it as a cookie
    return {"token": settings.admin_secret_token}


@router.delete("/auth/logout")
def admin_logout():
    return {"ok": True}


@router.get("/orders")
def admin_list_orders(current_user: Annotated[dict, Depends(require_admin)]):
    db = get_admin_db()
    result = db.table("orders").select("*, order_items(*)").order("created_at", desc=True).execute()
    return result.data or []


@router.get("/orders/{order_id}")
def admin_get_order(order_id: str, current_user: Annotated[dict, Depends(require_admin)]):
    db = get_admin_db()
    result = db.table("orders").select("*, order_items(*), payments(*)").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return result.data[0]


@router.patch("/orders/{order_id}")
def admin_update_order(order_id: str, body: dict, current_user: Annotated[dict, Depends(require_admin)]):
    db = get_admin_db()
    allowed = {"status", "payment_status", "tracking_number", "notes"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    result = db.table("orders").update(updates).eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return result.data[0]


@router.get("/analytics")
def admin_analytics(current_user: Annotated[dict, Depends(require_admin)]):
    db = get_admin_db()

    orders = db.table("orders").select("total, status, created_at, payment_status").execute().data or []
    paid = [o for o in orders if o.get("payment_status") == "paid"]
    revenue = sum(o["total"] for o in paid)
    pending = len([o for o in orders if o.get("status") == "pending"])

    return {
        "total_orders": len(orders),
        "paid_orders": len(paid),
        "pending_orders": pending,
        "total_revenue": revenue,
    }


@router.get("/users")
def admin_list_users(current_user: Annotated[dict, Depends(require_admin)]):
    db = get_admin_db()
    result = db.table("users").select(
        "id, email, first_name, last_name, phone, role, is_active, created_at"
    ).order("created_at", desc=True).execute()
    return result.data or []
