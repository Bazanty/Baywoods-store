import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, getProductReviews } from "@/lib/supabase/queries";
import ProductClient from "./ProductClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "Product Not Found" };
  return { title: product.name };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.category, 4).catch(() => []),
    getProductReviews(product.id).catch(() => []),
  ]);

  return <ProductClient product={product} related={related} reviews={reviews} />;
}
