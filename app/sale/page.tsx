import { getSaleProducts } from "@/lib/supabase/queries";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";

export const metadata = { title: "Sale" };

export default async function SalePage() {
  const products = await getSaleProducts().catch(() => []);

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="bg-ink text-citrine py-3 text-center border-y border-ink">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase">
          SALE / Up to 30% off · Limited time
        </p>
      </div>

      <div className="container-px py-10 border-b border-ink/15">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
          <span className="text-ink">/</span> LIMITED TIME
        </p>
        <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.9] text-ink text-6xl sm:text-7xl lg:text-8xl">
          Sale<span className="relative inline-block">
            <span className="relative z-10">.</span>
            <span aria-hidden className="absolute -inset-x-1 bottom-1 h-2 bg-citrine -z-0" />
          </span>
        </h1>
        <div className="mt-4 flex items-baseline gap-6 font-mono text-[11px] tracking-[0.14em] uppercase">
          <span className="text-ink">{String(products.length).padStart(3, "0")} pieces</span>
          <span className="text-muted">· Don&apos;t sleep on these.</span>
        </div>
      </div>

      <div className="container-px py-8">
        {products.length === 0 ? (
          <div className="text-center py-20 border-y border-ink/15">
            <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">No sale right now.</p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6">
              Check back soon
            </p>
            <Link href="/new-arrivals" className="btn-outline">
              Browse new arrivals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
