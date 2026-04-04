-- =============================================================
-- Baywoods Store — Production Migration
-- Run this in Supabase SQL Editor after the base schema.sql
-- =============================================================

-- 1. Add mpesa to payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mpesa';

-- 2. Add missing columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS email            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_method   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(50)   NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipping_method  VARCHAR(50)   NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 3. Add missing columns to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mpesa_receipt        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS result_desc          TEXT,
  ADD COLUMN IF NOT EXISTS metadata             JSONB;

CREATE INDEX IF NOT EXISTS idx_payments_checkout_request
  ON payments (checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

-- 4. Fix addresses table to match app fields
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS label      VARCHAR(50)  NOT NULL DEFAULT 'Home',
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS county     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW();

-- Backfill first_name/last_name from full_name where possible
UPDATE addresses
SET first_name = SPLIT_PART(full_name, ' ', 1),
    last_name  = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- 5. Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(100) NOT NULL DEFAULT 'General',
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_read
  ON contact_messages (is_read, created_at DESC);

-- 6. Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email
  ON newsletter_subscribers (email);

-- 7. Stripe payment intent tracking
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_payments_stripe
  ON payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- 8. Row Level Security for user data
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews    ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY IF NOT EXISTS orders_user_policy ON orders
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Users can only see/edit their own addresses
CREATE POLICY IF NOT EXISTS addresses_user_select ON addresses
  FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY IF NOT EXISTS addresses_user_insert ON addresses
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY IF NOT EXISTS addresses_user_update ON addresses
  FOR UPDATE USING (user_id::text = auth.uid()::text);
CREATE POLICY IF NOT EXISTS addresses_user_delete ON addresses
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Users can submit reviews (one per product)
CREATE POLICY IF NOT EXISTS reviews_user_insert ON reviews
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Everyone can read approved reviews
CREATE POLICY IF NOT EXISTS reviews_public_read ON reviews
  FOR SELECT USING (is_approved = TRUE);

-- Service role bypass (for API routes using service key)
-- Make sure your API routes use SUPABASE_SERVICE_ROLE_KEY for writes
