# Baywoods FastAPI Service — Optional / Legacy

> **Status: optional, not deployed.** The production storefront uses Next.js route
> handlers (`app/api/**`) and server actions (`app/admin/actions.ts`) as its
> backend. This FastAPI service exists for future extraction — e.g. a public
> API, mobile clients, or a Railway-hosted API — and is intentionally not in
> the request path today.

Do not enable this service as the storefront backend until each affected
frontend call has been migrated and tested individually. Removing it is also a
valid choice if no second consumer materialises.

## Authoritative Sources of Truth

| Concern | Lives in | Notes |
| --- | --- | --- |
| Public storefront API | `app/api/**` | Orders, M-Pesa callback, reservations, reviews, invoices |
| Trusted admin mutations | `app/admin/actions.ts` | Cookie-guarded by `requireAdmin()` |
| Read layer | `lib/supabase/queries.ts` | Maps Supabase rows to the app `Product` type |
| Schema | `schema.sql` + `supabase/migrations/*` | Apply in order |
| Auth | Supabase Auth (frontend) | The FastAPI `/auth` router uses a separate JWT/password-table scheme — **not** what production currently uses |

## What the FastAPI Service Currently Knows About

- `/products` reads the current Supabase product schema (categories, images,
  variants, inventory, reviews).
- `/orders` accepts snake_case and camelCase payloads, uses the variant-aware
  inventory RPCs from the same migrations the Next.js app uses.
- `/mpesa` reads `MPESA_ENVIRONMENT` to pick sandbox vs production.
- `/contact` and `/newsletter` write through the Supabase service-role key.
- `/admin` is JWT-protected (separate from the storefront's `admin_session`
  cookie scheme).

## Why It Is Not in Production Use

- Auth identity surfaces diverge from the storefront (Supabase Auth vs JWT).
- Admin sessions diverge (`admin_session` cookie vs JWT).
- The Next.js storefront does not call this service for checkout, account,
  or admin operations.
- M-Pesa callbacks are wired to the Next.js route, not this service.

If you ever extract part of the API:

1. Migrate one route at a time and bridge the auth difference explicitly.
2. Add integration tests against a seeded Supabase database before swapping
   any production call site.
3. Update `NEXT_PUBLIC_*` configuration to point the affected calls at the
   new base URL.

## Local Development

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

`GET /` returns a small payload that documents the optional role:

```json
{ "service": "baywoods-fastapi", "status": "ok", "role": "optional", "primary_backend": "nextjs" }
```

`GET /health` includes `env` and `mpesa_environment` for verification.

In development, API docs are available at `http://localhost:8000/docs`.

## Environment

Copy `backend/.env.example` to `backend/.env`. Keep `MPESA_ENVIRONMENT=sandbox`
locally and set it to `production` only when Safaricom production credentials
and the callback URL are ready. Even then, prefer leaving the callback URL
pointed at the Next.js handler unless you have committed to migration.

## Removing This Service

If no second consumer ever appears, removing this directory is a safe
cleanup. Delete the `backend/` folder and the `Optional FastAPI checks` block
in the root README. No production code paths depend on it.
