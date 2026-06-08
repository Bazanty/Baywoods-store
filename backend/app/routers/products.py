from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.services.supabase_client import get_db

router = APIRouter()

PRODUCT_SELECT = """
id,
name,
slug,
description,
base_price,
compare_price,
is_featured,
verification_status,
verification_notes,
verified_at,
verified_by,
created_at,
categories!category_id ( slug, name ),
product_images ( url, is_primary, sort_order ),
inventory ( quantity, reserved ),
product_variants (
  id,
  is_active,
  variant_options ( option_name, option_value )
),
reviews ( rating )
"""

THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60


def _as_relation(value):
    if isinstance(value, list):
        return value[0] if value else None
    return value


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _category_ids(category_slug: str) -> list[str]:
    db = get_db()
    parent_res = (
        db.table("categories")
        .select("id")
        .eq("slug", category_slug)
        .limit(1)
        .execute()
    )
    if not parent_res.data:
        return []

    parent_id = parent_res.data[0]["id"]
    child_res = db.table("categories").select("id").eq("parent_id", parent_id).execute()
    return [parent_id, *[row["id"] for row in (child_res.data or [])]]


def _map_product(row: dict) -> dict:
    images = sorted(
        row.get("product_images") or [],
        key=lambda image: (not bool(image.get("is_primary")), image.get("sort_order") or 0),
    )

    sizes: set[str] = set()
    colors: dict[str, str] = {}
    variants: list[dict] = []

    for variant in row.get("product_variants") or []:
        if variant.get("is_active") is False:
            continue

        options = variant.get("variant_options") or []
        color_name = next(
            (opt.get("option_value") for opt in options if opt.get("option_name") == "Color"),
            None,
        )
        color_hex = next(
            (opt.get("option_value") for opt in options if opt.get("option_name") == "Color Hex"),
            None,
        )
        size = next(
            (opt.get("option_value") for opt in options if opt.get("option_name") == "Size"),
            None,
        )

        if size:
            sizes.add(size)
        if color_name and color_hex:
            colors.setdefault(color_name, color_hex)

        variants.append({"id": variant["id"], "size": size, "colorName": color_name})

    ratings = [
        float(review["rating"])
        for review in row.get("reviews") or []
        if review.get("rating") is not None
    ]
    rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

    available_stock = 0
    for stock in row.get("inventory") or []:
        available_stock += max(
            0,
            int(stock.get("quantity") or 0) - int(stock.get("reserved") or 0),
        )

    badge = None
    if row.get("compare_price") is not None:
        badge = "sale"
    elif row.get("is_featured"):
        badge = "hot"
    else:
        created_at = _parse_datetime(row.get("created_at"))
        if created_at:
            age = datetime.now(timezone.utc) - created_at.astimezone(timezone.utc)
            if age.total_seconds() < THIRTY_DAYS_SECONDS:
                badge = "new"

    category = _as_relation(row.get("categories")) or {}

    return {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "category": category.get("slug") or "accessories",
        "price": float(row.get("base_price") or 0),
        "sale_price": float(row["compare_price"]) if row.get("compare_price") is not None else None,
        "images": [image["url"] for image in images if image.get("url")],
        "sizes": sorted(sizes),
        "colors": [{"name": name, "hex": hex_value} for name, hex_value in colors.items()],
        "variants": variants,
        "description": row.get("description") or "",
        "material": None,
        "badge": badge,
        "rating": rating,
        "review_count": len(ratings),
        "in_stock": available_stock > 0,
        "stock_count": available_stock if available_stock > 0 else None,
        "verification_status": row.get("verification_status") or "PENDING",
        "verification_notes": row.get("verification_notes"),
        "verified_at": row.get("verified_at"),
        "verified_by": row.get("verified_by"),
    }


@router.get("")
def list_products(
    category: str | None = Query(None),
    in_stock: bool | None = Query(None),
    sort: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    db = get_db()
    query = db.table("products").select(PRODUCT_SELECT).eq("is_active", True)

    if category:
        category_ids = _category_ids(category)
        if not category_ids:
            return []
        query = query.in_("category_id", category_ids)

    sort_map = {
        "price-asc": ("base_price", False),
        "price-desc": ("base_price", True),
        "newest": ("created_at", True),
    }
    sort_column, sort_desc = sort_map.get(sort or "newest", ("created_at", True))
    query = query.order(sort_column, desc=sort_desc).range(offset, offset + limit - 1)

    result = query.execute()
    products = [_map_product(row) for row in (result.data or [])]

    if in_stock is not None:
        products = [product for product in products if product["in_stock"] == in_stock]
    if sort == "rating":
        products.sort(key=lambda product: product["rating"], reverse=True)

    return products


@router.get("/{slug}")
def get_product(slug: str):
    result = (
        get_db()
        .table("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return _map_product(result.data[0])
