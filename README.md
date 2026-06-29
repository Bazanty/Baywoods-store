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
- M-Pesa STK push through the direct Safaricom Daraja API
- Resend email and Twilio WhatsApp notifications
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
# Manual Buy Goods Till fallback (active until live Daraja credentials are issued)
NEXT_PUBLIC_MPESA_MANUAL=true
NEXT_PUBLIC_MPESA_TILL=5386846
```

With `NEXT_PUBLIC_MPESA_MANUAL=true`, checkout shows a Buy Goods Till and the
customer pastes their confirmation code; the order is saved `PENDING_PAYMENT`
and an admin confirms it from `/admin/payments`. Set it to `false` (and supply
live Daraja credentials) to reactivate the automated STK push flow. When
`MPESA_MOCK=true` the real Daraja STK push call is skipped entirely for local dev.

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
- Configure Vercel Cron with `CRON_SECRET` for abandoned cart and reservation cleanup routes (see `vercel.json`). The cron routes reject any request whose `Authorization: Bearer` header does not match `CRON_SECRET`.
- Set `MPESA_CALLBACK_URL` to the deployed callback route and register it as the STK callback in the Daraja portal.
- Set `MPESA_ENVIRONMENT=production` only in production, with live `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, and `MPESA_PASSKEY`.
- Keep `backend/` separate unless you are ready to migrate frontend calls to an external API base URL.

## M-Pesa Production Checks (Daraja)

The store ships with the manual Buy Goods Till flow enabled
(`NEXT_PUBLIC_MPESA_MANUAL=true`). To go live with automated STK push you must
have real Daraja credentials and run a real low-value STK push — this cannot be
verified without a live Safaricom account. Steps:

- Provide live `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, and `MPESA_PASSKEY` from the Daraja portal.
- `MPESA_CALLBACK_URL` must be a public HTTPS URL ending in `/api/mpesa/callback`.
- Set `MPESA_ENVIRONMENT=production` and `MPESA_MOCK=false`; flip `NEXT_PUBLIC_MPESA_MANUAL=false` to reactivate STK push.
- The callback route trusts Safaricom's published IP ranges (`isSafaricomIp` in `lib/security.ts`) rather than a shared HMAC secret, so no webhook secret is required in production. `MPESA_WEBHOOK_SECRET` / `verifyDarajaWebhookSecret` are kept for reference only and are not wired into the live callback.
- Run one low-value STK push, confirm the Daraja callback reaches `/api/mpesa/callback`, then check that the payment has a receipt and the order moves to `PAID`.
- If a payment stays pending, use the reconciliation actions in `/admin/payments` to query Daraja, replay a saved callback, or manually confirm only after verifying the receipt in the M-Pesa Business portal.

> **Auto-refund / reversal is intentionally disabled.** `isReversalConfigured()`
> in `lib/mpesa.ts` returns `false` and `initiateReversal()` throws, so the
> "Auto-refund via M-Pesa" button in `/admin/returns` is hidden. All refunds go
> through the **manual** path, which restores inventory and flips the order to
> `REFUNDED`. Wiring live reversals needs Daraja B2C/reversal credentials
> (`InitiatorName`, `SecurityCredential`, result/timeout callback URLs) that are
> not yet provisioned; the result callback at `/api/mpesa/reversal-callback` is
> already implemented and waiting for them.
