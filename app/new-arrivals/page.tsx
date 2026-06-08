import { getNewArrivals } from "@/lib/supabase/queries";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";

export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(24).catch(() => []);

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-10 border-b border-ink/15">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
          <span className="text-ink">/</span> JUST LANDED
        </p>
        <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.9] text-ink text-5xl sm:text-6xl lg:text-7xl">
          New arrivals.
        </h1>
        <div className="mt-4 flex items-baseline gap-6 font-mono text-[11px] tracking-[0.14em] uppercase">
          <span className="text-ink">{String(products.length).padStart(3, "0")} pieces</span>
          <span className="text-muted max-w-md">· Fresh drops, added weekly</span>
        </div>
      </div>

      <div className="container-px py-8">
        {products.length === 0 ? (
          <div className="text-center py-20 border-y border-ink/15">
            <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">Drops loading.</p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6">
              Stay tuned
            </p>
            <Link href="/shop" className="btn-outline">
              Browse all products
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
