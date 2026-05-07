import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user, get_current_user_optional
from app.schemas.orders import CreateOrderRequest
from app.services.email import send_order_confirmation, send_order_sms
from app.services.supabase_client import get_admin_db

router = APIRouter()


@router.post("", status_code=201)
def create_order(body: CreateOrderRequest):
    db = get_admin_db()

    addr = body.shipping_address
    order_res = db.table("orders").insert({
        "user_id":        body.user_id,
        "email":          body.email,
        "status":         "pending",
        "payment_method": body.payment_method,
        "payment_status": "pending",
        "shipping_name":  f"{addr.first_name} {addr.last_name}",
        "shipping_line1": addr.address,
        "shipping_city":  addr.city,
        "shipping_state": addr.county,
        "shipping_postal": "00100",
        "shipping_country": "KE",
        "shipping_phone": body.phone,
        "shipping_method": body.shipping_method,
        "subtotal":        body.subtotal,
        "discount_amount": body.discount_amount,
        "shipping_cost":   body.shipping_cost,
        "tax_amount":      0,
        "total":           body.total,
    }).select("id").execute()

    if not order_res.data:
        raise HTTPException(status_code=500, detail="Failed to create order")

    order_id = order_res.data[0]["id"]

    db.table("order_items").insert([
        {
            "order_id":     order_id,
            "product_id":   item.product_id,
            "product_name": item.product_name,
            "variant_name": item.variant_name,
            "unit_price":   item.unit_price,
            "quantity":     item.quantity,
            "line_total":   item.line_total,
        }
        for item in body.items
    ]).execute()

    if body.payment_method == "mpesa" and body.checkout_request_id:
        db.table("payments").insert({
            "order_id":            order_id,
            "method":              "mpesa",
            "amount":              body.total,
            "currency":            "KES",
            "status":              "pending",
            "checkout_request_id": body.checkout_request_id,
        }).execute()
    elif body.payment_method == "card" and body.stripe_payment_intent_id:
        db.table("payments").insert({
            "order_id":                   order_id,
            "method":                     "card",
            "amount":                     body.total,
            "currency":                   "KES",
            "status":                     "pending",
            "stripe_payment_intent_id":   body.stripe_payment_intent_id,
        }).execute()

    # Non-blocking notifications
    customer_name = f"{addr.first_name} {addr.last_name}"
    asyncio.create_task(send_order_confirmation(
        order_id=order_id,
        customer_name=customer_name,
        email=body.email,
        items=[{"name": i.product_name, "variant": i.variant_name,
                "qty": i.quantity, "price": i.unit_price} for i in body.items],
        subtotal=body.subtotal,
        shipping_cost=body.shipping_cost,
        discount=body.discount_amount,
        total=body.total,
        shipping_address=f"{addr.address}, {addr.city}, {addr.county}",
        payment_method=body.payment_method,
    ))
    asyncio.create_task(send_order_sms(
        phone=body.phone,
        customer_name=customer_name,
        order_id=order_id,
        total=body.total,
    ))

    return {"order_id": order_id}


@router.get("")
def list_orders(current_user: Annotated[dict, Depends(get_current_user)]):
    db = get_admin_db()
    result = db.table("orders").select("*, order_items(*)").eq(
        "user_id", current_user["sub"]
    ).order("created_at", desc=True).execute()
    return result.data or []


@router.get("/{order_id}")
def get_order(order_id: str, current_user: Annotated[dict, Depends(get_current_user)]):
    db = get_admin_db()
    result = db.table("orders").select("*, order_items(*)").eq("id", order_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")

    order = result.data[0]
    # Allow admin or the owning user
    if current_user.get("role") != "admin" and order.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return order
