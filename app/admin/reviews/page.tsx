import { Star } from "lucide-react";
import Link from "next/link";
import { getPendingReviews, approveReview, rejectReview } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getPendingReviews();
  const pending = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="px-8 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-ink">Reviews</h1>
        <p className="text-sm text-muted mt-0.5">
          {pending} awaiting approval · {reviews.length} total
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-stone py-14 text-center text-sm text-muted">
          No reviews submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`bg-white border p-5 ${r.isApproved ? "border-stone" : "border-amber-300"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Status + rating */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 ${
                        r.isApproved
                          ? "bg-forest/10 text-forest"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.isApproved ? "Published" : "Pending"}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < r.rating ? "fill-forest text-forest" : "fill-stone text-stone"}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Product */}
                  <Link
                    href={`/product/${r.productSlug}`}
                    target="_blank"
                    className="text-xs text-forest hover:underline underline-offset-2 mb-1 block"
                  >
                    {r.productName}
                  </Link>

                  {/* Author */}
                  <p className="text-xs text-muted mb-3">
                    {r.authorName}
                    {r.authorEmail && ` · ${r.authorEmail}`}
                  </p>

                  {/* Review content */}
                  {r.title && (
                    <p className="text-sm font-semibold text-ink mb-1">{r.title}</p>
                  )}
                  <p className="text-sm text-ink/75 leading-relaxed">{r.body}</p>
                </div>

                {/* Actions */}
                {!r.isApproved && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <form
                      action={async () => {
                        "use server";
                        await approveReview(r.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full text-xs font-medium px-4 py-2 bg-forest text-white hover:bg-forest-dark transition-colors"
                      >
                        Approve
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await rejectReview(r.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full text-xs font-medium px-4 py-2 border border-danger/40 text-danger hover:bg-danger/5 transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
