"use client";

import { useState } from "react";
import { Star, ThumbsUp, Pencil } from "lucide-react";
import { Review } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";
import Button from "@/components/ui/Button";

interface ReviewSectionProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  productId: string;
}

export default function ReviewSection({ reviews: initial, rating, reviewCount, productId }: ReviewSectionProps) {
  const reviews = initial;
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / Math.max(1, reviews.length)) * 100,
  }));

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
    <div className="pt-8 border-t border-stone">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-2xl text-ink">Customer Reviews</h2>
        {user && !submitted && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-sm text-forest hover:text-forest-dark transition-colors"
          >
            <Pencil size={13} />
            Write a Review
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-10 mb-10">
        <div className="shrink-0 text-center md:text-left">
          <p className="font-serif text-6xl font-medium text-ink">{rating.toFixed(1)}</p>
          <div className="flex gap-0.5 justify-center md:justify-start mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.round(rating) ? "fill-forest text-forest" : "text-stone fill-stone"}
              />
            ))}
          </div>
          <p className="text-xs text-muted mt-1">{reviewCount} reviews</p>
        </div>

        <div className="flex-1 space-y-2">
          {distribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-muted w-3 shrink-0">{star}</span>
              <Star size={10} className="fill-forest text-forest shrink-0" />
              <div className="flex-1 h-1.5 bg-stone rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                  viewport={{ once: true }}
                  className="h-full bg-forest rounded-full"
                />
              </div>
              <span className="text-xs text-muted w-4 shrink-0">{count}</span>
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
            className="border border-stone bg-cream p-6 mb-8 overflow-hidden"
          >
            <h3 className="font-serif text-lg text-ink mb-5">Your Review</h3>

            <div className="mb-4">
              <label className="label-base mb-2 block">Rating</label>
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
                      className={s <= form.rating ? "fill-forest text-forest" : "text-stone fill-stone"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="label-base">Title (optional)</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Sum it up in one line"
                className="input-base"
              />
            </div>

            <div className="mb-5">
              <label className="label-base">Review</label>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                placeholder="What did you think of this product?"
                className="input-base resize-none"
              />
            </div>

            <p className="text-xs text-muted mb-4">
              Your review will be visible after moderation.
            </p>

            {error && <p className="text-xs font-medium text-danger mb-4">{error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-1/3">
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="flex-1">
                Submit Review
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {submitted && (
        <div className="bg-forest/10 border border-forest/20 px-4 py-3 text-sm text-forest mb-6">
          Thanks for your review! It&apos;ll appear after moderation.
        </div>
      )}

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-stone pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-ink">{review.author}</p>
                  {review.verified && (
                    <span className="text-[10px] font-medium text-forest bg-forest-muted px-1.5 py-0.5">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={i < review.rating ? "fill-forest text-forest" : "text-stone fill-stone"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted shrink-0">
                {new Date(review.date).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <p className="text-sm text-ink/80 mt-3 leading-relaxed">{review.body}</p>
            <button
              onClick={() => setHelpful((h) => ({ ...h, [review.id]: true }))}
              disabled={helpful[review.id]}
              className="flex items-center gap-1.5 mt-3 text-xs text-muted hover:text-ink transition-colors disabled:opacity-50"
            >
              <ThumbsUp size={12} />
              Helpful ({helpful[review.id] ? review.helpful + 1 : review.helpful})
            </button>
          </div>
        ))}

        {reviews.length === 0 && !showForm && (
          <p className="text-sm text-muted py-6 text-center">
            No reviews yet.{" "}
            {user ? (
              <button onClick={() => setShowForm(true)} className="text-forest underline underline-offset-2">
                Be the first to review
              </button>
            ) : (
              "Be the first to review this product."
            )}
          </p>
        )}
      </div>
    </div>
  );
}
