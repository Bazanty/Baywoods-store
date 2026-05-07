from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # JWT (for custom auth — separate from Supabase Auth)
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # M-Pesa Daraja
    mpesa_consumer_key: str = ""
    mpesa_consumer_secret: str = ""
    mpesa_shortcode: str = "5234789"
    mpesa_passkey: str = ""
    mpesa_callback_url: str = ""
    mpesa_mock: bool = False

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Email (Resend)
    resend_api_key: str = ""
    email_from: str = "Baywoods <noreply@baywoods.co.ke>"

    # Africa's Talking SMS
    africastalking_api_key: str = ""
    africastalking_username: str = "baywoods"
    africastalking_sender: str = "BAYWOODS"

    # App
    environment: str = "development"
    admin_password: str = ""
    admin_secret_token: str = ""
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def mpesa_base_url(self) -> str:
        if self.is_production:
            return "https://api.safaricom.co.ke"
        return "https://sandbox.safaricom.co.ke"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
