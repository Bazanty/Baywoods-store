from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ShippingAddress(APIModel):
    first_name: str = Field(validation_alias=AliasChoices("first_name", "firstName"))
    last_name: str = Field(validation_alias=AliasChoices("last_name", "lastName"))
    address: str
    city: str
    county: str


class OrderItem(APIModel):
    product_id: str = Field(validation_alias=AliasChoices("product_id", "productId"))
    variant_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("variant_id", "variantId"),
    )
    product_name: str = Field(validation_alias=AliasChoices("product_name", "productName"))
    variant_name: str = Field(validation_alias=AliasChoices("variant_name", "variantName"))
    unit_price: float = Field(validation_alias=AliasChoices("unit_price", "unitPrice"))
    quantity: int
    line_total: float = Field(validation_alias=AliasChoices("line_total", "lineTotal"))


class CreateOrderRequest(APIModel):
    user_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("user_id", "userId"),
    )
    email: str
    phone: str
    shipping_address: ShippingAddress = Field(
        validation_alias=AliasChoices("shipping_address", "shippingAddress"),
    )
    shipping_method: Literal["standard", "express"] = Field(
        default="standard",
        validation_alias=AliasChoices("shipping_method", "shippingMethod"),
    )
    shipping_cost: float = Field(validation_alias=AliasChoices("shipping_cost", "shippingCost"))
    subtotal: float
    discount_amount: float = Field(
        default=0,
        validation_alias=AliasChoices("discount_amount", "discountAmount"),
    )
    total: float
    payment_method: Literal["mpesa"] = Field(
        validation_alias=AliasChoices("payment_method", "paymentMethod"),
    )
    checkout_request_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("checkout_request_id", "checkoutRequestId"),
    )
    session_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("session_id", "sessionId"),
    )
    expected_consumed: int | None = Field(
        default=None,
        validation_alias=AliasChoices("expected_consumed", "expectedConsumed"),
    )
    items: list[OrderItem]
