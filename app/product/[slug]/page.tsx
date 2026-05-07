import { notFound } from "next/navigation";
import {
  getProductBySlugServer,
  getRelatedProductsServer,
  getProductReviewsServer,
} from "@/lib/supabase/serverQueries";
import ProductClient from "./ProductClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const product = await getProductBySlugServer(params.slug).catch(() => null);
  if (!product) return { title: "Product Not Found" };

  const desc =
    product.description?.slice(0, 155) ??
    `${product.name} — shop the latest from Baywoods.`;
  const image = product.images?.[0];

  return {
    title: `${product.name} — Baywoods`,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 1200, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: image ? [image] : [],
    },
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlugServer(params.slug).catch(() => null);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProductsServer(product.id, product.category, 4).catch(() => []),
    getProductReviewsServer(product.id).catch(() => []),
  ]);

  return <ProductClient product={product} related={related} reviews={reviews} />;
}
