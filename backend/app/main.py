from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, orders, mpesa, contact, newsletter, admin, products

settings = get_settings()

app = FastAPI(
    title="Baywoods Store API",
    version="1.0.0",
    description=(
        "Optional standalone API for Baywoods. The production storefront "
        "currently uses Next.js route handlers and server actions as its "
        "primary backend."
    ),
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "https://baywoods.co.ke",
        "https://www.baywoods.co.ke",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",       tags=["auth"])
app.include_router(products.router,    prefix="/products",   tags=["products"])
app.include_router(orders.router,      prefix="/orders",     tags=["orders"])
app.include_router(mpesa.router,       prefix="/mpesa",      tags=["mpesa"])
app.include_router(contact.router,     prefix="/contact",    tags=["contact"])
app.include_router(newsletter.router,  prefix="/newsletter", tags=["newsletter"])
app.include_router(admin.router,       prefix="/admin",      tags=["admin"])


@app.get("/")
def root():
    return {
        "service": "baywoods-fastapi",
        "status": "ok",
        "role": "optional",
        "primary_backend": "nextjs",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "env": settings.environment,
        "mpesa_environment": settings.mpesa_environment,
        "role": "optional",
    }
