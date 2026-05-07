"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { productImages } from "@/lib/productImages";

interface CategoryItem {
  slug: string;
  label: string;
  img: string;
  summary: string;
  className: string;
}

const BASE_CATEGORIES: CategoryItem[] = [
  {
    slug: "shoes",
    label: "Sneakers",
    img: productImages.nike[0],
    summary: "Daily pairs, statement Jordans, and clean runners.",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    img: productImages.nike[12],
    summary: "Heavyweight fleece and relaxed city layers.",
    className: "",
  },
  {
    slug: "joggers",
    label: "Joggers",
    img: productImages["new-balance"][5],
    summary: "Soft rotation pieces for everyday movement.",
    className: "",
  },
  {
    slug: "caps",
    label: "Caps",
    img: productImages.vans[3],
    summary: "Finishing pieces for low-effort fits.",
    className: "",
  },
  {
    slug: "accessories",
    label: "Accessories",
    img: productImages.adidas[2],
    summary: "Belts, extras, and final details.",
    className: "",
  },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function CategoryGrid() {
  const [cats, setCats] = useState<CategoryItem[]>(BASE_CATEGORIES);

  useEffect(() => {
    (async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, slug, name")
        .eq("is_active", true)
        .order("sort_order")
        .limit(5);

      if (!categories?.length) return;

      const items: CategoryItem[] = await Promise.all(
        categories.map(async (cat, idx) => {
          const { data: products } = await supabase
            .from("products")
            .select("product_images(url, is_primary)")
            .eq("is_active", true)
            .eq("category_id", cat.id)
            .limit(1);

          const productImagesFromDb = (products?.[0] as any)?.product_images ?? [];
          const primary =
            productImagesFromDb.find((image: any) => image.is_primary)?.url ??
            productImagesFromDb[0]?.url;
          const fallback = BASE_CATEGORIES[idx] ?? BASE_CATEGORIES[0];

          return {
            slug: cat.slug,
            label: cat.name,
            img: primary ?? fallback.img,
            summary: fallback.summary,
            className: fallback.className,
          };
        })
      );

      setCats(items);
    })();
  }, []);

  return (
    <section className="container-px mt-20 lg:mt-24">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker mb-2">Shop by category</p>
          <h2 className="section-title">Start with the fit.</h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest transition-colors hover:text-forest-dark"
        >
          View all
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:auto-rows-[260px] lg:auto-rows-[300px]"
      >
        {cats.map((cat) => (
          <motion.article
            key={cat.slug}
            variants={item}
            className={`group relative min-h-[260px] overflow-hidden bg-stone-light ${cat.className}`}
          >
            <Link href={`/shop/${cat.slug}`} className="block h-full">
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/35" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-serif text-3xl leading-none text-white">{cat.label}</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">{cat.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  Shop now
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
