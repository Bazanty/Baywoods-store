"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchProducts } from "@/lib/supabase/queries";
import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";
import { Search, SearchX } from "lucide-react";
import Link from "next/link";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams?.get("q") || "";
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTerm(q);
  }, [q]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchProducts(q)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-10 border-b border-ink/15">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
          <span className="text-ink">/</span> SEARCH
        </p>
        {q ? (
          <>
            <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl lg:text-6xl">
              &ldquo;{q}&rdquo;
            </h1>
            <p className="mt-3 font-mono text-[11px] tracking-[0.14em] uppercase text-ink">
              {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "match" : "matches"}`}
            </p>
          </>
        ) : (
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl lg:text-6xl">
            What are you<br className="hidden sm:inline" /> looking for?
          </h1>
        )}
      </div>

      <div className="container-px py-8">
        <form
          action="/search"
          className="mb-10 flex items-center gap-3 border-b-2 border-ink py-2 max-w-xl"
        >
          <Search size={14} className="text-muted shrink-0" />
          <input
            name="q"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search shoes, hoodies, joggers..."
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine transition-colors"
          >
            Search →
          </button>
        </form>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-beige-dark animate-pulse" />
            ))}
          </div>
        )}

        {!loading && q && results.length === 0 && (
          <div className="text-center py-20 border-y border-ink/15">
            <SearchX size={40} className="text-muted mx-auto mb-4" strokeWidth={1.25} />
            <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">
              No results for &ldquo;{q}&rdquo;
            </p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6">
              Check spelling, or browse a rail
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Shoes", "Hoodies", "Joggers", "Caps"].map((cat) => (
                <Link
                  key={cat}
                  href={`/shop/${cat.toLowerCase()}`}
                  className="px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/30 text-ink hover:bg-ink hover:text-citrine hover:border-ink transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!q && (
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
              <span className="text-ink">/</span> Popular rails
            </p>
            <div className="flex flex-wrap gap-2">
              {["Shoes", "Hoodies", "Joggers", "Sweatpants", "Caps", "Accessories"].map((c) => (
                <Link
                  key={c}
                  href={`/shop/${c.toLowerCase()}`}
                  className="px-4 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/30 text-ink hover:bg-ink hover:text-citrine hover:border-ink transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Loading…</div>}>
      <SearchResults />
    </Suspense>
  );
}
