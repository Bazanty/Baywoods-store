"""Safaricom Daraja API — mirrors lib/mpesa.ts logic."""
import base64
import re
from datetime import datetime

import httpx

from app.config import get_settings

SANDBOX_SHORTCODE = "174379"
SANDBOX_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"


def format_phone(raw: str) -> str:
    """Normalise a Kenyan number to 254XXXXXXXXX."""
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("254"):
        return digits
    if digits.startswith("0"):
        return f"254{digits[1:]}"
    if digits.startswith(("7", "1")):
        return f"254{digits}"
    return digits


def _timestamp() -> str:
    return datetime.now().strftime("%Y%m%d%H%M%S")


def _password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


async def get_access_token() -> str:
    settings = get_settings()
    credentials = base64.b64encode(
        f"{settings.mpesa_consumer_key}:{settings.mpesa_consumer_secret}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{settings.mpesa_base_url}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {credentials}"},
            timeout=15,
        )
        res.raise_for_status()
        return res.json()["access_token"]


async def initiate_stk_push(phone: str, amount: int, order_id: str, description: str) -> dict:
    settings = get_settings()
    token = await get_access_token()

    shortcode = settings.mpesa_shortcode if settings.is_production else SANDBOX_SHORTCODE
    passkey = settings.mpesa_passkey if settings.is_production else SANDBOX_PASSKEY
    ts = _timestamp()
    pwd = _password(shortcode, passkey, ts)
    tx_type = "CustomerBuyGoodsOnline" if settings.is_production else "CustomerPayBillOnline"

    body = {
        "BusinessShortCode": shortcode,
        "Password": pwd,
        "Timestamp": ts,
        "TransactionType": tx_type,
        "Amount": max(1, int(amount)),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": settings.mpesa_callback_url,
        "AccountReference": f"BW-{order_id}"[:12],
        "TransactionDesc": description[:13],
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{settings.mpesa_base_url}/mpesa/stkpush/v1/processrequest",
            json=body,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        res.raise_for_status()
        return res.json()


async def query_stk_push(checkout_request_id: str) -> dict:
    settings = get_settings()
    token = await get_access_token()

    shortcode = settings.mpesa_shortcode if settings.is_production else SANDBOX_SHORTCODE
    passkey = settings.mpesa_passkey if settings.is_production else SANDBOX_PASSKEY
    ts = _timestamp()
    pwd = _password(shortcode, passkey, ts)

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{settings.mpesa_base_url}/mpesa/stkpushquery/v1/query",
            json={
                "BusinessShortCode": shortcode,
                "Password": pwd,
                "Timestamp": ts,
                "CheckoutRequestID": checkout_request_id,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        res.raise_for_status()
        return res.json()
