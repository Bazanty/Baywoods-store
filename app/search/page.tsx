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
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8">
        <div className="mb-8">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-1">
            Search
          </p>
          {q ? (
            <>
              <h1 className="font-serif text-4xl text-ink">&ldquo;{q}&rdquo;</h1>
              <p className="text-sm text-muted mt-2">
                {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "result" : "results"}`}
              </p>
            </>
          ) : (
            <h1 className="font-serif text-4xl text-ink">What are you looking for?</h1>
          )}
        </div>

        <form
          action="/search"
          className="mb-10 flex items-center gap-3 border border-stone bg-cream px-4 py-3 max-w-xl"
        >
          <Search size={16} className="text-muted shrink-0" />
          <input
            name="q"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search shoes, hoodies, joggers..."
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="text-xs font-semibold tracking-wide text-forest hover:text-forest-dark"
          >
            Search
          </button>
        </form>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && q && results.length === 0 && (
          <div className="text-center py-20">
            <SearchX size={48} className="text-stone mx-auto mb-4" strokeWidth={1} />
            <p className="text-ink font-medium mb-2">No results for &ldquo;{q}&rdquo;</p>
            <p className="text-sm text-muted mb-6">
              Try checking your spelling, or browse our categories.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Shoes", "Hoodies", "Joggers", "Caps"].map((cat) => (
                <Link
                  key={cat}
                  href={`/shop/${cat.toLowerCase()}`}
                  className="px-4 py-2 border border-stone text-sm text-ink hover:border-ink transition-colors"
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
            <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-4">
              Popular Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {["Shoes", "Hoodies", "Joggers", "Sweatpants", "Caps", "Accessories"].map((c) => (
                <Link
                  key={c}
                  href={`/shop/${c.toLowerCase()}`}
                  className="px-5 py-2.5 border border-stone text-sm text-ink hover:border-ink hover:bg-cream transition-colors"
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
    <Suspense fallback={<div className="pt-32 text-center text-muted">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
