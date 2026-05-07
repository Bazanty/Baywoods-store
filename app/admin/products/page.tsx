import Link from "next/link";
import { Plus, PackageX } from "lucide-react";
import { getAdminProducts } from "../actions";
import { formatPrice } from "@/lib/utils";
import ProductRowActions from "@/components/admin/ProductRowActions";
import BulkActions from "./BulkActions";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await getAdminProducts();

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-7 max-w-6xl">
        <div>
          <h1 className="font-serif text-2xl text-ink">Products</h1>
          <p className="text-sm text-muted mt-0.5">{products.length} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-ink text-white text-sm px-5 py-2.5 hover:bg-ink/90 transition-colors"
        >
          <Plus size={14} />
          New Product
        </Link>
      </div>

      <div className="bg-white rounded overflow-hidden max-w-6xl">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <PackageX size={32} strokeWidth={1} />
            <p className="text-sm">No products yet.</p>
            <Link
              href="/admin/products/new"
              className="text-sm text-forest underline underline-offset-2"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <BulkActions
            products={products.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              basePrice: p.base_price,
              comparePrice: p.compare_price,
              isActive: p.is_active,
              categoryName: p.categories?.name ?? null,
              thumb:
                p.product_images?.find((img: any) => img.is_primary)?.url ??
                p.product_images?.[0]?.url ??
                null,
              stock: p.inventory?.[0]
                ? p.inventory[0].quantity - p.inventory[0].reserved
                : 0,
            }))}
          />
        )}
      </div>
    </div>
  );
}
