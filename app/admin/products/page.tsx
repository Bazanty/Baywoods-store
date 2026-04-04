import Link from "next/link";
import { Plus, PackageX } from "lucide-react";
import { getAdminProducts } from "../actions";
import { formatPrice } from "@/lib/utils";
import ProductRowActions from "@/components/admin/ProductRowActions";

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left">
                <th className="px-5 py-3.5 text-xs font-medium text-muted tracking-wider uppercase w-12" />
                <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">
                  Product
                </th>
                <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">
                  Category
                </th>
                <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase text-right">
                  Price
                </th>
                <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase text-right">
                  Stock
                </th>
                <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">
                  Status
                </th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {products.map((p: any, i: number) => {
                const thumb =
                  p.product_images?.find((img: any) => img.is_primary)?.url ??
                  p.product_images?.[0]?.url;
                const stock = p.inventory?.[0];
                const available = stock ? stock.quantity - stock.reserved : 0;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-stone/20 transition-colors ${i < products.length - 1 ? "border-b border-stone/50" : ""}`}
                  >
                    {/* Thumbnail */}
                    <td className="pl-5 pr-2 py-3">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded bg-stone-light"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-stone-light rounded flex items-center justify-center">
                          <PackageX size={14} className="text-muted" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-muted font-mono">{p.slug}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-muted capitalize">
                      {p.categories?.name ?? "—"}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-ink">{formatPrice(p.base_price)}</span>
                      {p.compare_price && (
                        <span className="block text-xs text-muted line-through">
                          {formatPrice(p.compare_price)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          available === 0
                            ? "text-danger font-medium"
                            : available <= 5
                            ? "text-amber-600 font-medium"
                            : "text-ink"
                        }
                      >
                        {available}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-sm font-medium ${
                          p.is_active
                            ? "bg-forest/10 text-forest"
                            : "bg-stone-light text-muted"
                        }`}
                      >
                        {p.is_active ? "Active" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <ProductRowActions productId={p.id} isActive={p.is_active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
