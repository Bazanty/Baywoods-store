import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProductForm from "@/components/admin/ProductForm";

interface Props {
  params: { id: string };
}

export default async function EditProductPage({ params }: Props) {
  const { data: p, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, description, short_description,
      base_price, compare_price, sku, is_featured, is_active,
      categories!category_id ( slug ),
      product_images ( url, is_primary, sort_order ),
      inventory ( quantity, reserved ),
      product_variants (
        is_active,
        variant_options ( option_name, option_value )
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !p) notFound();

  // Build initial form state from DB row
  const images = [...(p.product_images ?? [])]
    .sort((a, b) => (a.is_primary ? -1 : 1) || a.sort_order - b.sort_order)
    .map((img) => ({ url: img.url, publicId: "", isPrimary: img.is_primary }));

  const sizesSet = new Set<string>();
  const colorsMap = new Map<string, string>();

  for (const v of p.product_variants ?? []) {
    if (!v.is_active) continue;
    const opts = v.variant_options ?? [];
    const size = opts.find((o: any) => o.option_name === "Size")?.option_value;
    const colorName = opts.find((o: any) => o.option_name === "Color")?.option_value;
    const colorHex = opts.find((o: any) => o.option_name === "Color Hex")?.option_value;
    if (size) sizesSet.add(size);
    if (colorName && colorHex) colorsMap.set(colorName, colorHex);
  }

  const stock = (p.inventory as any[])?.[0];
  const cat = p.categories as any;

  const initial = {
    name: p.name,
    description: p.description ?? "",
    shortDescription: p.short_description ?? "",
    categorySlug: cat?.slug ?? "accessories",
    basePrice: String(p.base_price),
    comparePrice: p.compare_price ? String(p.compare_price) : "",
    sku: p.sku ?? "",
    isFeatured: p.is_featured,
    isActive: p.is_active,
    images,
    sizes: Array.from(sizesSet),
    colors: Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex })),
    stockQuantity: String(stock ? stock.quantity - stock.reserved : 0),
  };

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-ink">Edit Product</h1>
        <p className="text-sm text-muted mt-0.5 font-mono">{p.slug}</p>
      </div>
      <ProductForm productId={p.id} initial={initial} />
    </div>
  );
}
