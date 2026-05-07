CREATE TABLE IF NOT EXISTS abandoned_carts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID,
  email          VARCHAR(255) NOT NULL,
  items          JSONB NOT NULL,
  subtotal       NUMERIC(12,2) NOT NULL,
  recovered      BOOLEAN DEFAULT false,
  reminded_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_reminded ON abandoned_carts(reminded_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_email    ON abandoned_carts(email);
