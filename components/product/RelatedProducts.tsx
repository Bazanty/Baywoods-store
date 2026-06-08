import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="mb-10 grid grid-cols-12 items-end gap-6 border-b border-ink/15 pb-6">
        <div className="col-span-12 sm:col-span-9">
          <p className="section-kicker mb-4">YOU MAY ALSO LIKE</p>
          <h2 className="section-title">Pair it with.</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
