"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createCategory } from "../actions";
import { cn, slugify } from "@/lib/utils";

export default function NewCategoryForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    startTransition(async () => {
      try {
        await createCategory(name.trim());
        setName("");
      } catch (err: any) {
        setError(err.message ?? "Failed to create");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Puma"
          className="w-full bg-cream border border-stone text-ink text-sm px-3 py-2.5 outline-none focus:border-ink transition-colors placeholder:text-muted"
        />
        {name.trim() && (
          <p className="mt-1.5 text-xs text-muted">
            Slug: <span className="font-mono">{slugify(name)}</span>
          </p>
        )}
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full flex items-center justify-center gap-2 bg-ink text-white text-sm py-2.5 transition-colors",
          pending ? "opacity-70 cursor-not-allowed" : "hover:bg-ink/90"
        )}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {pending ? "Adding…" : "Add Category"}
      </button>
    </form>
  );
}
