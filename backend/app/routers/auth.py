from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.schemas.auth import AuthResponse, SignInRequest, SignUpRequest, WelcomeEmailRequest
from app.services.email import send_welcome_email
from app.services.supabase_client import get_admin_db

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _make_token(payload: dict) -> str:
    settings = get_settings()
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({**payload, "exp": exp}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(body: SignUpRequest):
    db = get_admin_db()

    existing = db.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = pwd_ctx.hash(body.password)
    result = db.table("users").insert({
        "email": body.email,
        "password_hash": hashed,
        "first_name": body.first_name,
        "last_name": body.last_name,
        "phone": body.phone,
        "role": "customer",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = result.data[0]
    token = _make_token({"sub": user["id"], "email": user["email"], "role": user["role"]})

    # Fire welcome email non-blocking
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(send_welcome_email(user["email"], user["first_name"]))
    except RuntimeError:
        pass

    return AuthResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "first_name": user["first_name"],
              "last_name": user["last_name"], "role": user["role"]},
    )


@router.post("/signin", response_model=AuthResponse)
def signin(body: SignInRequest):
    db = get_admin_db()
    result = db.table("users").select("*").eq("email", body.email).eq("is_active", True).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]
    if not pwd_ctx.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _make_token({"sub": user["id"], "email": user["email"], "role": user["role"]})

    return AuthResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "first_name": user["first_name"],
              "last_name": user["last_name"], "role": user["role"]},
    )


@router.get("/me")
def me_route(
    credentials=None,
):
    # Handled by deps.get_current_user at route level when needed
    return {"message": "Use Authorization: Bearer <token>"}


@router.post("/welcome")
async def welcome_email(body: WelcomeEmailRequest):
    await send_welcome_email(body.email, body.first_name)
    return {"success": True}
