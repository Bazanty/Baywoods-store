from supabase import create_client, Client
from app.config import get_settings

_client: Client | None = None
_admin: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        s = get_settings()
        _client = create_client(s.supabase_url, s.supabase_anon_key)
    return _client


def get_admin_db() -> Client:
    global _admin
    if _admin is None:
        s = get_settings()
        _admin = create_client(s.supabase_url, s.supabase_service_role_key)
    return _admin
