-- Track automated M-Pesa B2C Reversal flow alongside the existing manual
-- refund_reference column.
--
-- refund_method:
--   'manual'         — admin recorded an external refund (cash, prior reversal)
--   'mpesa_reversal' — Safaricom Daraja Reversal API was invoked
--
-- refund_status (only meaningful for mpesa_reversal):
--   'pending' — Daraja accepted the request, awaiting async callback
--   'success' — callback returned ResultCode 0
--   'failed'  — Daraja rejected, or callback returned non-zero ResultCode

ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS refund_method          TEXT,
  ADD COLUMN IF NOT EXISTS refund_status          TEXT,
  ADD COLUMN IF NOT EXISTS refund_conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_failure_reason  TEXT;

CREATE INDEX IF NOT EXISTS idx_returns_refund_conversation
  ON return_requests(refund_conversation_id)
  WHERE refund_conversation_id IS NOT NULL;
