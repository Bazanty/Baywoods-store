import { getSaleProducts } from "@/lib/supabase/queries";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";

export const metadata = { title: "Sale" };

export default async function SalePage() {
  const products = await getSaleProducts().catch(() => []);

  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="bg-danger text-white py-3 text-center">
        <p className="text-sm font-semibold tracking-wide">
          SALE - Up to 30% Off. Limited time only.
        </p>
      </div>

      <div className="container-px py-8">
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-danger mb-2">
            Limited Time
          </p>
          <h1 className="font-serif text-5xl lg:text-6xl text-ink">Sale</h1>
          <p className="text-sm text-muted mt-3">
            {products.length} items on sale. Don&apos;t sleep on these.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted mb-5">No sale items right now - check back soon.</p>
            <Link href="/new-arrivals" className="btn-outline">
              Browse New Arrivals
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
