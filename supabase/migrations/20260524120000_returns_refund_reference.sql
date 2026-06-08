-- Capture an external refund reference (M-Pesa reversal ID, cash receipt, etc.)
-- when an admin marks a return as refunded. Refunds are still executed manually
-- via Safaricom shortcode reversal; this column gives the audit trail.

ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS refund_reference TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ;
