# Baywoods Store

Baywoods Store is a Next.js storefront for Kenyan streetwear. The app includes product browsing, cart and checkout, Supabase-backed auth/data, admin management, M-Pesa payments, email/SMS notifications, and a chat widget.

## Backend Boundary

The production backend is the Next.js app:

- `app/api/**` handles public API routes such as orders, M-Pesa, contact, newsletter, reviews, invoices, reservations, and cron jobs.
- `app/admin/actions.ts` handles trusted admin mutations.
- `lib/supabase/**` contains the shared Supabase data access layer.

The `backend/` FastAPI service is **optional and not in the request path**. It is not called by the storefront today. It is kept as a starting point for a future extracted API (e.g. mobile clients). It should not be deployed as a replacement backend until auth, admin sessions, M-Pesa callbacks, and checkout are migrated intentionally. Removing it is also valid if no second consumer is planned. See `backend/README.md`.

## Tech Stack

- Next.js 14 App Router
- React 18 and Tailwind CSS
- Supabase Auth, Postgres, RLS, and RPC functions
- M-Pesa Daraja STK push
- Resend email and Africa's Talking SMS
- Cloudinary product/admin uploads
- Optional FastAPI service under `backend/`

## Local Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Required minimum environment for the storefront:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SECRET_TOKEN`
- `ORDER_TOKEN_SECRET`
- `CRON_SECRET`

For local M-Pesa development, keep:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_MOCK=true
MPESA_SKIP_IP_CHECK=true
```

Card payments are not active in the storefront. M-Pesa is the production checkout path.

## Database

Apply the Supabase schema and migrations before running full checkout/admin flows:

- `schema.sql`
- `supabase/migrations/*.sql`
- optional seed scripts under `scripts/`

Product data is read from Supabase through `lib/supabase/queries.ts`. Inventory-sensitive checkout uses the `decrement_inventory_v2`, `restore_inventory_v2`, and reservation RPCs from the migrations.

## Useful Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Optional FastAPI checks:

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Deployment Notes

- Deploy the Next.js app as the main production service.
- Configure Vercel Cron with `CRON_SECRET` for abandoned cart and reservation cleanup routes.
- Set `MPESA_CALLBACK_URL` to the deployed Next.js callback route unless you intentionally migrate M-Pesa to FastAPI.
- Keep `MPESA_ENVIRONMENT=production` only in production with real Daraja credentials.
- Keep `backend/` separate unless you are ready to migrate frontend calls to an external API base URL.

## M-Pesa Production Checks

Use `/admin/payments` after deployment to verify the live M-Pesa setup:

- `MPESA_CALLBACK_URL` must be a public HTTPS URL ending in `/api/mpesa/callback`.
- `MPESA_MOCK` should be off in production.
- `MPESA_SKIP_IP_CHECK` should be off after Safaricom callback delivery is verified.
- Run one low-value STK push, confirm the callback reaches `/api/mpesa/callback`, then check that the payment has a receipt and the order moves to `PAID`.
- If a payment stays pending, use the reconciliation actions in `/admin/payments` to query Safaricom, replay a saved callback, or manually confirm only after verifying the receipt in the M-Pesa portal.
