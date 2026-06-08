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
  span: string;
}

const BASE_CATEGORIES: CategoryItem[] = [
  {
    slug: "shoes",
    label: "Sneakers",
    img: productImages.nike[0],
    summary: "Daily pairs, statement Jordans, clean runners.",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    img: productImages.nike[12],
    summary: "Heavyweight fleece, city layers.",
    span: "",
  },
  {
    slug: "joggers",
    label: "Joggers",
    img: productImages["new-balance"][5],
    summary: "Soft rotation pieces.",
    span: "",
  },
  {
    slug: "caps",
    label: "Caps",
    img: productImages.vans[3],
    summary: "Finishing pieces.",
    span: "",
  },
  {
    slug: "accessories",
    label: "Accessories",
    img: productImages.adidas[2],
    summary: "Belts, extras, final details.",
    span: "",
  },
];

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
            span: fallback.span,
          };
        })
      );

      setCats(items);
    })();
  }, []);

  return (
    <section className="container-px mt-20 lg:mt-24">
      {/* Magazine header */}
      <div className="mb-10 grid grid-cols-12 items-end gap-6 border-b border-ink/15 pb-6">
        <div className="col-span-12 lg:col-span-7">
          <h2 className="section-title">Start with the fit.</h2>
        </div>
        <div className="col-span-12 lg:col-span-5 flex items-end justify-between lg:justify-end gap-6">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted max-w-[28ch]">
            Five rails. Built for rotation, not for show.
          </p>
          <Link
            href="/shop"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine inline-flex items-center gap-1 shrink-0"
          >
            All <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          animate: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 md:auto-rows-[260px] lg:auto-rows-[300px]"
      >
        {cats.map((cat, i) => (
          <motion.article
            key={cat.slug}
            variants={{
              initial: { opacity: 0, y: 18 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
            className={`group relative min-h-[260px] overflow-hidden border border-ink/10 bg-beige-dark ${cat.span}`}
          >
            <Link href={`/shop/${cat.slug}`} className="block h-full">
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {/* Top-left index marker */}
              <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.2em] uppercase text-cream bg-ink/80 backdrop-blur-sm px-2 py-1">
                / {String(i + 1).padStart(2, "0")}
              </div>
              {/* Bottom-left label block */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl sm:text-3xl tracking-[-0.02em] text-cream leading-none">
                      {cat.label}
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-cream/60 mt-2 max-w-[26ch]">
                      {cat.summary}
                    </p>
                  </div>
                  <span className="shrink-0 w-9 h-9 flex items-center justify-center border border-cream/30 text-cream group-hover:bg-citrine group-hover:text-ink group-hover:border-citrine transition-colors">
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
