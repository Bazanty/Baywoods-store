import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryClient from "./CategoryClient";

const VALID_CATEGORIES = [
  { slug: "shoes", label: "Shoes" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "jorts", label: "Jorts" },
  { slug: "joggers", label: "Joggers" },
  { slug: "sweatpants", label: "Sweatpants" },
  { slug: "shirts", label: "Shirts" },
  { slug: "caps", label: "Caps" },
  { slug: "belts", label: "Belts" },
  { slug: "accessories", label: "Accessories" },
];

export async function generateMetadata(
  { params }: { params: { category: string } }
): Promise<Metadata> {
  const meta = VALID_CATEGORIES.find((c) => c.slug === params.category);
  if (!meta) return { title: "Not Found" };

  const title = `${meta.label} — Baywoods`;
  const desc = `Shop ${meta.label.toLowerCase()} at Baywoods. Fresh drops, honest pricing, fast Kenya-wide delivery.`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    twitter:   { card: "summary", title, description: desc },
    alternates: { canonical: `/shop/${params.category}` },
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const catMeta = VALID_CATEGORIES.find((c) => c.slug === params.category);
  if (!catMeta) notFound();
  return <CategoryClient category={params.category} label={catMeta.label} />;
}
