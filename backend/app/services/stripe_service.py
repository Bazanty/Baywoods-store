import stripe as stripe_lib

from app.config import get_settings


def get_stripe() -> stripe_lib.Stripe:
    settings = get_settings()
    stripe_lib.api_key = settings.stripe_secret_key
    return stripe_lib


def create_payment_intent(amount: int, currency: str = "kes", metadata: dict | None = None) -> dict:
    stripe = get_stripe()
    intent = stripe.PaymentIntent.create(
        amount=amount * 100,  # smallest currency unit
        currency=currency.lower(),
        automatic_payment_methods={"enabled": True},
        metadata=metadata or {},
    )
    return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}


def construct_webhook_event(payload: bytes, sig: str) -> stripe_lib.Event:
    settings = get_settings()
    return stripe_lib.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
