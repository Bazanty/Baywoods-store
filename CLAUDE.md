# Baywoods Store

## Project Shape

Baywoods Store is a Next.js 14 App Router ecommerce app for Kenyan streetwear. The frontend lives under `app/` and `components/`, with Supabase used for products, categories, inventory, orders, wishlists, reviews, contact messages, and admin data.

Key paths:

- `app/shop/page.tsx` - all-products listing with filters and sorting.
- `app/shop/[category]/page.tsx` - category listing route.
- `app/product/[slug]/page.tsx` - product detail data loading.
- `components/shop/*` - PLP filters, sort dropdown, and product cards.
- `components/product/*` - PDP gallery, selectors, reviews, related products.
- `app/admin/*` - admin dashboard, catalog, orders, inventory, returns, coupons, contacts.
- `app/api/*` - checkout, payments, contact, newsletter, reviews, reservations, admin endpoints.
- `lib/supabase/queries.ts` - main product/category/review/order read layer.
- `lib/email.ts` - Resend transactional email helpers.
- `lib/store.ts` and `lib/authStore.ts` - client cart, wishlist, and auth state.
- `supabase/migrations/*` and `schema.sql` - database structure and operational migrations.

## Commands

Use npm in this repo.

```bash
npm run dev
npm run build
npm run lint
```

The app expects `.env.local` for local development. Start with `.env.example` when rebuilding an environment.

Important env vars:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`
- Stripe, M-Pesa, Cloudinary, and admin auth values as listed in `.env.example`.

## Implementation Notes

- Keep App Router pages server-rendered unless they need browser state. Push `"use client"` down into interactive components.
- Product data currently maps Supabase rows into the app `Product` type in `lib/supabase/queries.ts`.
- Category PLPs fetch by parent category plus child categories, so `/shop/shoes` can include brand child categories such as Nike or Vans.
- Product images are expected to be remote Cloudinary URLs unless they are static public assets.
- Reviews are submitted through `POST /api/reviews` and remain hidden until approved.
- Contact form submissions are saved first, then a confirmation email is attempted without failing the form on email delivery errors.
- Admin navigation has a desktop sidebar and a mobile drawer; keep menu items in `app/admin/_components/AdminNav.tsx`.
- Public share and install assets are referenced by `app/layout.tsx` and `public/site.webmanifest`: `favicon.ico`, `og-image.jpg`, `apple-icon.png`, `icon-192.png`, and `icon-512.png`.

## Style

- Match the existing restrained retail UI: beige/cream base, ink text, forest accents, serif display headings, compact controls.
- Use existing helpers and components before adding new primitives.
- Preserve user changes in the worktree. This repo often has many uncommitted files.
- Avoid broad refactors while fixing route, API, or UI gaps.
