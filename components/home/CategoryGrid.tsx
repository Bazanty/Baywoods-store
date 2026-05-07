"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface CategoryItem {
  slug: string;
  label: string;
  img: string;
  span: string;
}

const LAYOUT: Record<number, string> = {
  0: "col-span-2 row-span-2",
  1: "col-span-1 row-span-1",
  2: "col-span-1 row-span-1",
  3: "col-span-1 row-span-1",
  4: "col-span-1 row-span-1",
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80";

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function CategoryGrid() {
  const [cats, setCats] = useState<CategoryItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("slug, name")
        .eq("is_active", true)
        .order("sort_order")
        .limit(5);

      if (!categories?.length) return;

      const items: CategoryItem[] = await Promise.all(
        categories.map(async (cat, idx) => {
          const { data: images } = await supabase
            .from("products")
            .select("product_images(url, is_primary)")
            .eq("is_active", true)
            .eq("categories.slug", cat.slug)
            .limit(1);

          const productImages = (images?.[0] as any)?.product_images ?? [];
          const primary = productImages.find((i: any) => i.is_primary)?.url ?? productImages[0]?.url;

          return {
            slug: cat.slug,
            label: cat.name,
            img: primary ?? FALLBACK_IMG,
            span: LAYOUT[idx] ?? "col-span-1 row-span-1",
          };
        })
      );

      setCats(items);
    })();
  }, []);

  if (cats.length === 0) {
    return (
      <section className="container-px mt-24">
        <h2 className="section-title mb-8">Shop by Category</h2>
        <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[480px] lg:h-[560px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`bg-stone/30 animate-pulse ${LAYOUT[i]}`} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container-px mt-24">
      <div className="flex items-end justify-between mb-8">
        <h2 className="section-title">Shop by Category</h2>
        <Link href="/shop" className="text-xs font-medium tracking-widest uppercase text-forest hover:text-forest-dark transition-colors">
          View All →
        </Link>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-4 grid-rows-2 gap-3 h-[480px] lg:h-[560px]"
      >
        {cats.map((cat) => (
          <motion.div
            key={cat.slug}
            variants={item}
            className={`relative overflow-hidden group cursor-pointer ${cat.span}`}
          >
            <Link href={`/shop/${cat.slug}`} className="block h-full">
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent transition-opacity duration-300 group-hover:opacity-80" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-serif text-xl lg:text-2xl font-medium">
                  {cat.label}
                </p>
                <p className="text-white/70 text-xs mt-0.5 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now →
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
