from pydantic import BaseModel


class ProductColor(BaseModel):
    name: str
    hex: str


class Product(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    price: float
    sale_price: float | None = None
    images: list[str]
    sizes: list[str]
    colors: list[ProductColor]
    description: str
    material: str | None = None
    badge: str | None = None
    rating: float
    review_count: int
    in_stock: bool
    stock_count: int | None = None
    verification_status: str = "PENDING"
    verification_notes: str | None = None
    verified_at: str | None = None
    verified_by: str | None = None
