-- =============================================================
-- Web Push Subscriptions — per-device endpoints from PushManager
-- =============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         REFERENCES users (id) ON DELETE CASCADE,
  endpoint     TEXT         NOT NULL UNIQUE,
  p256dh       TEXT         NOT NULL,
  auth         TEXT         NOT NULL,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON push_subscriptions (user_id);
