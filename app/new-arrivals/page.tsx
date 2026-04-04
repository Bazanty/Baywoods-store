import { getNewArrivals } from "@/lib/supabase/queries";
import ProductCard from "@/components/shop/ProductCard";

export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(24).catch(() => []);

  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8">
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-2">
            Just Landed
          </p>
          <h1 className="font-serif text-5xl lg:text-6xl text-ink">New Arrivals</h1>
          <p className="text-sm text-muted mt-3 max-w-md">
            Fresh drops, added weekly. Be the first to cop the latest pieces from Baywoods.
          </p>
        </div>

        {products.length === 0 ? (
          <p className="text-muted text-center py-20">New arrivals coming soon — stay tuned.</p>
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
