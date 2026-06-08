DO $$
BEGIN
  CREATE TYPE product_verification_status AS ENUM (
    'PENDING',
    'VERIFIED_ORIGINAL',
    'NEEDS_REVIEW',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS verification_status product_verification_status NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS reservation_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_reason TEXT;

ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PENDING_PAYMENT';

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS merchant_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mpesa_receipt VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mpesa_phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS mpesa_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS raw_callback JSONB,
  ADD COLUMN IF NOT EXISTS callback_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS result_desc TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_payments_mpesa_cri
  ON payments (checkout_request_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_checkout_request_unique
  ON payments (checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi
  ON payments (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_orders_reservation_session
  ON orders (reservation_session_id)
  WHERE reservation_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION finalize_mpesa_payment(
  p_checkout_request_id TEXT,
  p_merchant_request_id TEXT,
  p_result_code TEXT,
  p_result_desc TEXT,
  p_receipt TEXT,
  p_phone TEXT,
  p_amount NUMERIC,
  p_raw_callback JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  pay payments%ROWTYPE;
  ord orders%ROWTYPE;
  item RECORD;
  inv_id UUID;
  consumed_count INTEGER := 0;
  stock_failed BOOLEAN := false;
  now_ts TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO pay
    FROM payments
   WHERE checkout_request_id = p_checkout_request_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_checkout_request_id');
  END IF;

  IF pay.status IN ('paid', 'failed', 'refunded') THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'payment_status', pay.status);
  END IF;

  SELECT * INTO ord
    FROM orders
   WHERE id = pay.order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE payments
       SET status = CASE WHEN p_result_code = '0' THEN 'paid'::payment_status ELSE 'failed'::payment_status END,
           merchant_request_id = COALESCE(p_merchant_request_id, merchant_request_id),
           mpesa_receipt = p_receipt,
           mpesa_phone = p_phone,
           mpesa_amount = p_amount,
           raw_callback = p_raw_callback,
           provider_response = p_raw_callback,
           provider_tx_id = COALESCE(p_receipt, provider_tx_id),
           result_desc = p_result_desc,
           failure_code = CASE WHEN p_result_code = '0' THEN NULL ELSE p_result_code END,
           paid_at = CASE WHEN p_result_code = '0' THEN now_ts ELSE paid_at END,
           callback_received_at = now_ts,
           updated_at = now_ts
     WHERE id = pay.id;

    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found', 'payment_id', pay.id);
  END IF;

  IF p_result_code = '0' THEN
    IF ord.reservation_session_id IS NOT NULL THEN
      consumed_count := consume_reservations(ord.reservation_session_id);
    END IF;

    IF consumed_count = 0 THEN
      FOR item IN
        SELECT product_id, variant_id, quantity
          FROM order_items
         WHERE order_id = ord.id
      LOOP
        IF item.variant_id IS NULL THEN
          SELECT id INTO inv_id
            FROM inventory
           WHERE product_id = item.product_id
             AND variant_id IS NULL
             AND quantity - reserved >= item.quantity
           FOR UPDATE;
        ELSE
          SELECT id INTO inv_id
            FROM inventory
           WHERE product_id = item.product_id
             AND variant_id = item.variant_id
             AND quantity - reserved >= item.quantity
           FOR UPDATE;
        END IF;

        IF NOT FOUND THEN
          stock_failed := true;
          EXIT;
        END IF;
      END LOOP;

      IF NOT stock_failed THEN
        FOR item IN
          SELECT product_id, variant_id, quantity
            FROM order_items
           WHERE order_id = ord.id
        LOOP
          IF item.variant_id IS NULL THEN
            UPDATE inventory
               SET quantity = quantity - item.quantity,
                   updated_at = now_ts
             WHERE product_id = item.product_id
               AND variant_id IS NULL;
          ELSE
            UPDATE inventory
               SET quantity = quantity - item.quantity,
                   updated_at = now_ts
             WHERE product_id = item.product_id
               AND variant_id = item.variant_id;
          END IF;
        END LOOP;
      END IF;
    END IF;

    UPDATE payments
       SET status = 'paid',
           merchant_request_id = COALESCE(p_merchant_request_id, merchant_request_id),
           mpesa_receipt = p_receipt,
           mpesa_phone = p_phone,
           mpesa_amount = p_amount,
           raw_callback = p_raw_callback,
           provider_response = p_raw_callback,
           provider_tx_id = COALESCE(p_receipt, provider_tx_id),
           result_desc = p_result_desc,
           failure_code = NULL,
           paid_at = now_ts,
           callback_received_at = now_ts,
           updated_at = now_ts
     WHERE id = pay.id;

    IF stock_failed THEN
      UPDATE orders
         SET status = 'VERIFICATION_PENDING',
             payment_status = 'paid',
             payment_confirmed_at = now_ts,
             failed_reason = 'Payment received, but stock could not be decremented automatically.',
             updated_at = now_ts
       WHERE id = ord.id;

      RETURN jsonb_build_object('ok', true, 'payment_status', 'paid', 'order_status', 'VERIFICATION_PENDING', 'stock', 'needs_review');
    END IF;

    UPDATE orders
       SET status = 'PAID',
           payment_status = 'paid',
           payment_confirmed_at = now_ts,
           failed_reason = NULL,
           updated_at = now_ts
     WHERE id = ord.id;

    RETURN jsonb_build_object('ok', true, 'payment_status', 'paid', 'order_status', 'PAID', 'stock', 'decremented');
  END IF;

  IF ord.reservation_session_id IS NOT NULL THEN
    PERFORM release_session_reservations(ord.reservation_session_id);
  END IF;

  UPDATE payments
     SET status = 'failed',
         merchant_request_id = COALESCE(p_merchant_request_id, merchant_request_id),
         mpesa_phone = p_phone,
         mpesa_amount = p_amount,
         raw_callback = p_raw_callback,
         provider_response = p_raw_callback,
         result_desc = p_result_desc,
         failure_code = p_result_code,
         callback_received_at = now_ts,
         updated_at = now_ts
   WHERE id = pay.id;

  UPDATE orders
     SET status = 'FAILED',
         payment_status = 'failed',
         failed_reason = p_result_desc,
         cancelled_at = CASE WHEN p_result_code = '1032' THEN now_ts ELSE cancelled_at END,
         updated_at = now_ts
   WHERE id = ord.id;

  RETURN jsonb_build_object('ok', true, 'payment_status', 'failed', 'order_status', 'FAILED', 'failure_code', p_result_code);
END;
$$;
