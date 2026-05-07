CREATE TABLE IF NOT EXISTS stripe_events (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS; no policies needed for public access.
