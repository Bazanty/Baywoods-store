-- Allow admins to edit reviews and post a store reply visible on the PDP.
-- store_reply renders directly under the review body; null = no reply yet.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS store_reply    TEXT,
  ADD COLUMN IF NOT EXISTS store_reply_at TIMESTAMPTZ;
