"""Email and SMS notification helpers."""
import asyncio
import httpx

from app.config import get_settings


async def send_welcome_email(to_email: str, first_name: str) -> None:
    settings = get_settings()
    if not settings.resend_api_key:
        return

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to_email],
                "subject": "Welcome to Baywoods 🛍️",
                "html": f"""
                    <p>Hey {first_name},</p>
                    <p>Welcome to Baywoods — Kenya's freshest streetwear store.</p>
                    <p>Browse our latest drops at <a href="https://baywoods.co.ke">baywoods.co.ke</a>.</p>
                    <p>— The Baywoods Team</p>
                """,
            },
            timeout=10,
        )


async def send_order_confirmation(
    order_id: str,
    customer_name: str,
    email: str,
    items: list[dict],
    subtotal: float,
    shipping_cost: float,
    discount: float,
    total: float,
    shipping_address: str,
    payment_method: str,
) -> None:
    settings = get_settings()
    if not settings.resend_api_key:
        return

    items_html = "".join(
        f"<tr><td>{i['name']} ({i['variant']})</td><td>×{i['qty']}</td><td>KSh {i['price']:,.0f}</td></tr>"
        for i in items
    )

    html = f"""
        <h2>Order Confirmed — #{order_id[:8].upper()}</h2>
        <p>Hi {customer_name}, your order has been placed successfully.</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
          {items_html}
        </table>
        <p>Subtotal: KSh {subtotal:,.0f}</p>
        <p>Shipping: KSh {shipping_cost:,.0f}</p>
        {"<p>Discount: -KSh " + f"{discount:,.0f}</p>" if discount else ""}
        <p><strong>Total: KSh {total:,.0f}</strong></p>
        <p>Shipping to: {shipping_address}</p>
        <p>Payment: {payment_method.upper()}</p>
    """

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [email],
                "subject": f"Order #{order_id[:8].upper()} Confirmed — Baywoods",
                "html": html,
            },
            timeout=10,
        )


async def send_order_sms(phone: str, customer_name: str, order_id: str, total: float) -> None:
    settings = get_settings()
    if not settings.africastalking_api_key:
        return

    message = (
        f"Hi {customer_name.split()[0]}, your Baywoods order "
        f"#{order_id[:8].upper()} (KSh {total:,.0f}) is confirmed. "
        "We'll text you when it ships!"
    )

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.africastalking.com/version1/messaging",
            headers={
                "apiKey": settings.africastalking_api_key,
                "Accept": "application/json",
            },
            data={
                "username": settings.africastalking_username,
                "to": phone,
                "message": message,
                "from": settings.africastalking_sender,
            },
            timeout=10,
        )
