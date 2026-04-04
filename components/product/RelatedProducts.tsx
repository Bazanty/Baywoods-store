import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-20 pt-12 border-t border-stone">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-serif text-2xl lg:text-3xl text-ink">You May Also Like</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
