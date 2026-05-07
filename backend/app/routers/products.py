"""
Products router — currently serves from Supabase if a products table exists,
falls back to an empty list. The frontend still uses static data from lib/data.ts;
this endpoint is ready for Phase 2 when products move to the DB.
"""
from fastapi import APIRouter, Query

from app.services.supabase_client import get_db

router = APIRouter()


@router.get("")
def list_products(
    category: str | None = Query(None),
    in_stock: bool | None = Query(None),
    sort: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    db = get_db()
    q = db.table("products").select("*")

    if category:
        q = q.eq("category", category)
    if in_stock is not None:
        q = q.eq("in_stock", in_stock)

    sort_map = {
        "price-asc":   ("price", False),
        "price-desc":  ("price", True),
        "newest":      ("created_at", True),
        "rating":      ("rating", True),
    }
    col, desc = sort_map.get(sort or "newest", ("created_at", True))
    q = q.order(col, desc=desc).range(offset, offset + limit - 1)

    result = q.execute()
    return result.data or []


@router.get("/{slug}")
def get_product(slug: str):
    db = get_db()
    result = db.table("products").select("*").eq("slug", slug).execute()
    if not result.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return result.data[0]
