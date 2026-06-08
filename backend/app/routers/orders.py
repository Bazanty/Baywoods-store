import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user
from app.schemas.orders import CreateOrderRequest, OrderItem
from app.services.email import send_order_confirmation, send_order_sms
from app.services.supabase_client import get_admin_db

router = APIRouter()


def _restore_inventory(db, items: list[OrderItem]) -> None:
    for item in items:
        db.rpc(
            "restore_inventory_v2",
            {
                "p_product_id": item.product_id,
                "p_variant_id": item.variant_id,
                "p_qty": item.quantity,
            },
        ).execute()


def _has_tracked_inventory(db, product_id: str) -> bool:
    result = (
        db.table("inventory")
        .select("id")
        .eq("product_id", product_id)
        .limit(1)
        .execute()
    )
    return bool(result.data)


def _consume_or_decrement_inventory(db, body: CreateOrderRequest) -> list[OrderItem]:
    if body.session_id:
        try:
            consumed = db.rpc(
                "consume_reservations",
                {"p_session_id": body.session_id},
            ).execute()
            if (consumed.data or 0) > 0:
                return body.items
        except Exception:
            # If the reservation RPC is unavailable or the hold expired, fall
            # through to the direct decrement path below.
            pass

    decremented: list[OrderItem] = []
    for item in body.items:
        try:
            result = db.rpc(
                "decrement_inventory_v2",
                {
                    "p_product_id": item.product_id,
                    "p_variant_id": item.variant_id,
                    "p_qty": item.quantity,
                },
            ).execute()
        except Exception as exc:
            if not _has_tracked_inventory(db, item.product_id):
                continue
            _restore_inventory(db, decremented)
            raise HTTPException(status_code=409, detail=f"{item.product_name} stock could not be reserved") from exc

        if result.data is False:
            if not _has_tracked_inventory(db, item.product_id):
                continue
            _restore_inventory(db, decremented)
            raise HTTPException(
                status_code=409,
                detail=f"{item.product_name} is out of stock or has insufficient quantity",
            )

        decremented.append(item)

    return decremented


async def _send_notifications(order_id: str, body: CreateOrderRequest) -> None:
    addr = body.shipping_address
    customer_name = f"{addr.first_name} {addr.last_name}"
    await asyncio.gather(
        send_order_confirmation(
            order_id=order_id,
            customer_name=customer_name,
            email=body.email,
            items=[
                {
                    "name": item.product_name,
                    "variant": item.variant_name,
                    "qty": item.quantity,
                    "price": item.unit_price,
                }
                for item in body.items
            ],
            subtotal=body.subtotal,
            shipping_cost=body.shipping_cost,
            discount=body.discount_amount,
            total=body.total,
            shipping_address=f"{addr.address}, {addr.city}, {addr.county}",
            payment_method=body.payment_method,
        ),
        send_order_sms(
            phone=body.phone,
            customer_name=customer_name,
            order_id=order_id,
            total=body.total,
        ),
        return_exceptions=True,
    )


@router.post("", status_code=201)
async def create_order(body: CreateOrderRequest):
    if not body.items:
        raise HTTPException(status_code=400, detail="No items in order")

    db = get_admin_db()
    decremented_items = _consume_or_decrement_inventory(db, body)
    addr = body.shipping_address

    try:
        order_res = db.table("orders").insert({
            "user_id":          body.user_id,
            "email":            body.email,
            "status":           "pending",
            "payment_method":   body.payment_method,
            "payment_status":   "pending",
            "shipping_name":    f"{addr.first_name} {addr.last_name}",
            "shipping_line1":   addr.address,
            "shipping_city":    addr.city,
            "shipping_state":   addr.county,
            "shipping_postal":  "00100",
            "shipping_country": "KE",
            "shipping_phone":   body.phone,
            "shipping_method":  body.shipping_method,
            "subtotal":         body.subtotal,
            "discount_amount":  body.discount_amount,
            "shipping_cost":    body.shipping_cost,
            "tax_amount":       0,
            "total":            body.total,
        }).select("id").execute()
    except Exception as exc:
        _restore_inventory(db, decremented_items)
        raise HTTPException(status_code=500, detail="Failed to create order") from exc

    if not order_res.data:
        _restore_inventory(db, decremented_items)
        raise HTTPException(status_code=500, detail="Failed to create order")

    order_id = order_res.data[0]["id"]

    items_res = db.table("order_items").insert([
        {
            "order_id":      order_id,
            "product_id":    item.product_id,
            "variant_id":    item.variant_id,
            "product_name":  item.product_name,
            "variant_name":  item.variant_name,
            "unit_price":    item.unit_price,
            "quantity":      item.quantity,
            "line_total":    item.line_total,
        }
        for item in body.items
    ]).execute()

    if not items_res.data:
        db.table("orders").delete().eq("id", order_id).execute()
        _restore_inventory(db, decremented_items)
        raise HTTPException(status_code=500, detail="Failed to create order items")

    if body.payment_method == "mpesa" and body.checkout_request_id:
        db.table("payments").insert({
            "order_id":            order_id,
            "method":              "mpesa",
            "amount":              body.total,
            "currency":            "KES",
            "status":              "pending",
            "checkout_request_id": body.checkout_request_id,
        }).execute()
    asyncio.create_task(_send_notifications(order_id, body))
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
    if current_user.get("role") != "admin" and order.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return order
