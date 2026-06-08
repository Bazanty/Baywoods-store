"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ThumbsUp, Pencil } from "lucide-react";
import { Review } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";

// ---------------------------------------------------------------------------
// Voter fingerprint — a UUID stored in localStorage so the "helpful" button
// stays disabled across page refreshes without requiring a login.
// The server also enforces uniqueness via review_helpful_votes, so this is
// just a UX layer on top of the authoritative DB constraint.
// ---------------------------------------------------------------------------

const VOTER_KEY = "bw_voter_id";
const VOTED_KEY = "bw_helpful_votes_v1";

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem(VOTER_KEY);
    if (stored) return stored;
    // Simple UUID v4 via crypto
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VOTER_KEY, id);
    return id;
  } catch {
    return "";
  }
}

function getVotedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function markVoted(reviewId: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getVotedIds();
    ids.add(reviewId);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...ids]));
  } catch {
    // quota exceeded — best effort
  }
}

// ---------------------------------------------------------------------------

interface ReviewSectionProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  productId: string;
}

export default function ReviewSection({ reviews: initial, rating, reviewCount, productId }: ReviewSectionProps) {
  // Mutable per-review helpful counts, updated optimistically after a confirmed
  // server response.
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initial.map((r) => [r.id, r.helpful]))
  );

  // IDs the current browser has already voted on (loaded from localStorage).
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Tracks which reviews have an in-flight request.
  const [voting, setVoting] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();

  // Hydrate voted IDs from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setVotedIds(getVotedIds());
  }, []);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: initial.filter((r) => r.rating === star).length,
    pct: (initial.filter((r) => r.rating === star).length / Math.max(1, initial.length)) * 100,
  }));

  const handleHelpful = useCallback(async (reviewId: string) => {
    // Optimistic guard: already voted or in-flight → no-op.
    if (votedIds.has(reviewId) || voting.has(reviewId)) return;

    const fingerprint = getOrCreateVoterId();
    if (!fingerprint) return;

    setVoting((prev) => new Set(prev).add(reviewId));

    try {
      const res = await fetch("/api/reviews/helpful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, fingerprint }),
      });

      if (!res.ok) return; // server error — leave counts unchanged, user can retry

      const data = await res.json();

      if (data.ok) {
        // Server accepted the vote — update count from authoritative response.
        setHelpfulCounts((prev) => ({ ...prev, [reviewId]: data.helpful }));
        markVoted(reviewId);
        setVotedIds((prev) => new Set(prev).add(reviewId));
      }
      // If data.alreadyVoted the server already has the vote; mark locally too.
      if (data.alreadyVoted) {
        markVoted(reviewId);
        setVotedIds((prev) => new Set(prev).add(reviewId));
      }
    } catch {
      // Network error — silently swallow, button stays enabled for retry.
    } finally {
      setVoting((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  }, [votedIds, voting]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: form.rating,
          title: form.title,
          body: form.body,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not submit review.");
        return;
      }

      setSubmitted(true);
      setShowForm(false);
      setForm({ rating: 5, title: "", body: "" });
    } catch {
      setError("Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-10 border-t border-ink/15">
      <div className="flex items-end justify-between mb-10 border-b border-ink/15 pb-6">
        <div>
          <p className="section-kicker mb-4">REVIEWS</p>
          <h2 className="section-title">What people say.</h2>
        </div>
        {user && !submitted && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine transition-colors inline-flex items-center gap-2"
          >
            <Pencil size={11} />
            Write review
          </button>
        )}
      </div>

      {/* Rating summary */}
      <div className="grid grid-cols-12 gap-8 mb-12">
        <div className="col-span-12 md:col-span-4">
          <p className="font-display text-7xl font-medium tracking-[-0.03em] text-ink leading-none">
            {rating.toFixed(1)}
          </p>
          <div className="flex gap-0.5 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.round(rating) ? "fill-ink text-ink" : "text-ink/15 fill-ink/15"}
              />
            ))}
          </div>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-3">
            / Based on {reviewCount} reviews
          </p>
        </div>

        <div className="col-span-12 md:col-span-8 space-y-2 md:pt-2">
          {distribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted w-6 shrink-0">{star}★</span>
              <div className="flex-1 h-[3px] bg-ink/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                  viewport={{ once: true }}
                  className="h-full bg-ink"
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted w-8 shrink-0 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmitReview}
            className="border border-ink bg-cream p-6 mb-10 overflow-hidden"
          >
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ Compose</p>
            <h3 className="font-display text-2xl tracking-[-0.02em] text-ink mb-6">Your review</h3>

            <div className="mb-5">
              <p className="label-base">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    className="p-0.5"
                  >
                    <Star
                      size={22}
                      className={s <= form.rating ? "fill-ink text-ink" : "text-ink/20 fill-ink/20"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="label-base">Title (optional)</p>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Sum it up in one line"
                className="input-base"
              />
            </div>

            <div className="mb-6">
              <p className="label-base">Review</p>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                placeholder="What did you think of this product?"
                className="input-base resize-none"
              />
            </div>

            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-4">
              / Visible after moderation
            </p>

            {error && (
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger mb-4">
                / {error}
              </p>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {submitted && (
        <div className="border-l-2 border-citrine pl-4 py-3 mb-8">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink">
            / Thanks. Your review will appear after moderation.
          </p>
        </div>
      )}

      <div className="space-y-0">
        {initial.map((review, i) => {
          const isVoted = votedIds.has(review.id);
          const isVoting = voting.has(review.id);
          const count = helpfulCounts[review.id] ?? review.helpful;

          return (
            <div key={review.id} className="border-t border-ink/15 py-6 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
                    /{String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display text-base tracking-[-0.01em] text-ink">{review.author}</p>
                      {review.verified && (
                        <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-ink bg-citrine px-1.5 py-0.5">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < review.rating ? "fill-ink text-ink" : "text-ink/15 fill-ink/15"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted shrink-0">
                  {new Date(review.date).toLocaleDateString("en-KE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {review.title && (
                <p className="font-display text-base tracking-[-0.01em] text-ink pl-0 sm:pl-12 mb-1">{review.title}</p>
              )}
              <p className="text-sm text-ink/80 leading-relaxed pl-0 sm:pl-12">{review.body}</p>
              {review.storeReply && (
                <div className="mt-3 sm:ml-12 border-l-2 border-citrine pl-4 py-2 bg-beige-dark/30">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink mb-1">/ Baywoods replied</p>
                  <p className="text-sm text-ink/85 leading-relaxed">{review.storeReply}</p>
                </div>
              )}
              <button
                onClick={() => handleHelpful(review.id)}
                disabled={isVoted || isVoting}
                aria-label={isVoted ? "Already marked helpful" : "Mark as helpful"}
                className={`flex items-center gap-2 mt-4 sm:ml-12 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors disabled:cursor-default ${
                  isVoted
                    ? "text-ink opacity-50"
                    : "text-muted hover:text-ink"
                }`}
              >
                <ThumbsUp size={11} className={isVoted ? "fill-ink/40" : ""} />
                Helpful ({count})
              </button>
            </div>
          );
        })}

        {initial.length === 0 && !showForm && (
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted py-8 text-center border-y border-ink/15">
            / No reviews yet.{" "}
            {user ? (
              <button onClick={() => setShowForm(true)} className="text-ink underline-citrine">
                Be the first →
              </button>
            ) : (
              "Be the first to review."
            )}
          </p>
        )}
      </div>
    </div>
  );
}
