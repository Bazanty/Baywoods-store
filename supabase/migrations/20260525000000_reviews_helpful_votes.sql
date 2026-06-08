-- Add helpful vote count to reviews and a deduplication table so the same
-- browser fingerprint can only vote once per review.
--
-- Design notes:
-- • helpful is an INTEGER counter on the review row itself — fast to read,
--   no joins needed when displaying reviews.
-- • review_helpful_votes stores (review_id, voter_fingerprint) pairs.
--   voter_fingerprint is a UUID generated client-side on first visit and
--   persisted in localStorage ("bw_voter_id"). The UNIQUE constraint on the
--   pair is the authoritative dedup guard; the API returns ok:false when the
--   constraint fires so the client knows not to increment the display counter.
-- • No auth.users reference — anonymous visitors can vote too.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS helpful INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id        UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_fingerprint TEXT       NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (review_id, voter_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review
  ON review_helpful_votes (review_id);

-- No RLS needed on votes — the API route uses the service-role key.
-- reviews.helpful is updated by the API, not by direct client writes.
