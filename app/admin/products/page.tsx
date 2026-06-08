import Link from "next/link";
import { Plus, PackageX } from "lucide-react";
import { getAdminProducts } from "../actions";
import { formatPrice } from "@/lib/utils";
import ProductRowActions from "@/components/admin/ProductRowActions";
import BulkActions from "./BulkActions";
import ExportButton from "../_components/ExportButton";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await getAdminProducts();

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="max-w-6xl border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> PRODUCTS
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">All products.</h1>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">
              {String(products.length).padStart(3, "0")} total
            </p>
            <ExportButton type="products" label="Export CSV" />
            <Link href="/admin/products/new" className="btn-primary">
              <Plus size={13} />
              New product
            </Link>
          </div>
        </div>
      </div>

      <div className="border border-ink/15 overflow-hidden max-w-6xl">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <PackageX size={28} strokeWidth={1.25} />
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase">/ No products yet.</p>
            <Link
              href="/admin/products/new"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink underline-citrine"
            >
              Add your first product →
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
              stock: (p.inventory ?? []).reduce(
                (sum: number, row: any) => sum + Number(row.quantity ?? 0) - Number(row.reserved ?? 0),
                0
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
}
