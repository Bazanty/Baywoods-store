-- Audit log of admin push broadcasts. Populated by broadcastPush() so the
-- admin can see what was sent, when, and how many subscribers reached it.

CREATE TABLE IF NOT EXISTS push_broadcasts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  url        TEXT,
  delivered  INTEGER NOT NULL DEFAULT 0,
  failed     INTEGER NOT NULL DEFAULT 0,
  pruned     INTEGER NOT NULL DEFAULT 0,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_broadcasts_sent_at ON push_broadcasts(sent_at DESC);
