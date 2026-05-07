from pydantic import BaseModel


class StkPushRequest(BaseModel):
    phone: str
    amount: float
    order_id: str | None = None
    description: str = "Baywoods Order"


class StkQueryRequest(BaseModel):
    checkout_request_id: str


class StkPushResponse(BaseModel):
    checkout_request_id: str
    merchant_request_id: str
    customer_message: str
