"use client";

import { useState, useTransition } from "react";
import { Pencil, MessageSquare, X } from "lucide-react";
import {
  approveReview,
  rejectReview,
  updateReview,
  setReviewReply,
} from "@/app/admin/actions";

interface Props {
  id: string;
  isApproved: boolean;
  title: string | null;
  body: string;
  rating: number;
  storeReply: string | null;
}

export default function ReviewActions({ id, isApproved, title, body, rating, storeReply }: Props) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"none" | "edit" | "reply">("none");
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState(title ?? "");
  const [editBody, setEditBody] = useState(body);
  const [editRating, setEditRating] = useState(rating);
  const [reply, setReply] = useState(storeReply ?? "");

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(null);
      try {
        await fn();
        setMode("none");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed.");
      }
    });

  return (
    <div className="flex flex-col gap-2 shrink-0 w-44">
      {mode === "none" && (
        <>
          {!isApproved && (
            <>
              <button
                disabled={pending}
                onClick={() => run(() => approveReview(id))}
                className="w-full font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 bg-ink text-citrine hover:bg-forest-dark transition-colors disabled:opacity-50"
              >
                Approve →
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => rejectReview(id))}
                className="w-full font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 border border-danger/40 text-danger hover:bg-danger hover:text-cream transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </>
          )}
          <button
            disabled={pending}
            onClick={() => setMode("edit")}
            className="w-full font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 border border-ink/30 text-ink hover:border-ink transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            disabled={pending}
            onClick={() => setMode("reply")}
            className="w-full font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 border border-ink/30 text-ink hover:border-ink transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={11} /> {storeReply ? "Edit reply" : "Reply"}
          </button>
        </>
      )}

      {mode === "edit" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setEditRating(s)}
                className={`text-sm ${s <= editRating ? "text-ink" : "text-ink/20"}`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full text-xs border border-stone bg-cream px-2 py-1.5 text-ink outline-none focus:border-ink placeholder:text-muted"
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full text-xs border border-stone bg-cream px-2 py-1.5 text-ink outline-none focus:border-ink resize-none placeholder:text-muted"
          />
          <div className="flex gap-1">
            <button
              disabled={pending}
              onClick={() =>
                run(() => updateReview(id, { title: editTitle, body: editBody, rating: editRating }))
              }
              className="flex-1 font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 bg-ink text-cream hover:bg-forest-dark transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setMode("none"); setError(null); }}
              className="font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 border border-stone text-muted hover:text-ink"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {mode === "reply" && (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Reply as the store…"
            className="w-full text-xs border border-stone bg-cream px-2 py-1.5 text-ink outline-none focus:border-ink resize-none placeholder:text-muted"
          />
          <div className="flex gap-1">
            <button
              disabled={pending}
              onClick={() => run(() => setReviewReply(id, reply))}
              className="flex-1 font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 bg-ink text-cream hover:bg-forest-dark transition-colors disabled:opacity-50"
            >
              {storeReply ? "Update" : "Post"}
            </button>
            {storeReply && (
              <button
                disabled={pending}
                onClick={() => run(() => setReviewReply(id, null))}
                className="font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 border border-danger/40 text-danger hover:bg-danger hover:text-cream transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => { setMode("none"); setError(null); }}
              className="font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 border border-stone text-muted hover:text-ink"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
