import { Star } from "lucide-react";
import Link from "next/link";
import { getPendingReviews } from "@/app/admin/actions";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getPendingReviews();
  const pending = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> REVIEWS
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Customer reviews.</h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
            <span className="text-ink">{pending} pending</span>
            <span className="text-muted"> · {reviews.length} total</span>
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="border border-ink/15 py-14 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
          / No reviews submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className={`border bg-cream p-5 ${r.isApproved ? "border-ink/15" : "border-ink"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted">/{String(i + 1).padStart(2, "0")}</span>
                    <span
                      className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${
                        r.isApproved ? "bg-citrine text-ink" : "border border-ink text-ink"
                      }`}
                    >
                      {r.isApproved ? "Published" : "Pending"}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < r.rating ? "fill-ink text-ink" : "fill-ink/15 text-ink/15"}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                      {new Date(r.createdAt).toLocaleDateString("en-KE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Link
                    href={`/product/${r.productSlug}`}
                    target="_blank"
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink underline-citrine mb-1 inline-block"
                  >
                    {r.productName} →
                  </Link>

                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-3">
                    / {r.authorName}{r.authorEmail && ` · ${r.authorEmail}`}
                  </p>

                  {r.title && (
                    <p className="font-display text-base tracking-[-0.01em] text-ink mb-1">{r.title}</p>
                  )}
                  <p className="text-sm text-ink/75 leading-relaxed">{r.body}</p>

                  {r.storeReply && (
                    <div className="mt-3 border-l-2 border-citrine pl-4 py-2 bg-beige-dark/30">
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink mb-1">/ Store reply</p>
                      <p className="text-sm text-ink/85 leading-relaxed">{r.storeReply}</p>
                      {r.storeReplyAt && (
                        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                          {new Date(r.storeReplyAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ReviewActions
                  id={r.id}
                  isApproved={r.isApproved}
                  title={r.title}
                  body={r.body}
                  rating={r.rating}
                  storeReply={r.storeReply}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
