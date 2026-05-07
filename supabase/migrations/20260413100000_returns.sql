CREATE TYPE return_status AS ENUM ('requested', 'approved', 'denied', 'received', 'refunded');

CREATE TABLE IF NOT EXISTS return_requests (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id    UUID,
  email      VARCHAR(255) NOT NULL,
  reason     TEXT NOT NULL,
  status     return_status NOT NULL DEFAULT 'requested',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_returns_order  ON return_requests(order_id);
