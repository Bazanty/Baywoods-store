from typing import Literal
from pydantic import BaseModel


class ShippingAddress(BaseModel):
    first_name: str
    last_name: str
    address: str
    city: str
    county: str


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    variant_name: str
    unit_price: float
    quantity: int
    line_total: float


class CreateOrderRequest(BaseModel):
    user_id: str | None = None
    email: str
    phone: str
    shipping_address: ShippingAddress
    shipping_method: Literal["standard", "express"] = "standard"
    shipping_cost: float
    subtotal: float
    discount_amount: float = 0
    total: float
    payment_method: Literal["mpesa", "card", "paypal"]
    checkout_request_id: str | None = None
    stripe_payment_intent_id: str | None = None
    items: list[OrderItem]
