"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/supabase/queries";
import { productImages } from "@/lib/productImages";
import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

const fallbackEdits = [
  {
    title: "Court icons",
    href: "/shop/shoes",
    image: productImages.nike[10],
    copy: "Jordan lows, Dunks, Forces, daily staples.",
  },
  {
    title: "Neutral runners",
    href: "/shop/shoes",
    image: productImages["new-balance"][8],
    copy: "New Balance, Adidas, easy silhouettes.",
  },
  {
    title: "After-dark layers",
    href: "/shop/hoodies",
    image: productImages.vans[8],
    copy: "Fleece, cargos, heavier pieces.",
  },
];

export default function TrendingSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getFeaturedProducts(4).then(setProducts).catch(() => setProducts([]));
  }, []);

  return (
    <section className="container-px mt-24 lg:mt-28">
      {/* Magazine header */}
      <div className="mb-10 grid grid-cols-12 items-end gap-6 border-b border-ink/15 pb-6">
        <div className="col-span-12 lg:col-span-7">
          <h2 className="section-title">The current rotation.</h2>
        </div>
        <div className="col-span-12 lg:col-span-5 flex items-end justify-between lg:justify-end gap-6">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted max-w-[26ch]">
            What everyone&apos;s wearing this week.
          </p>
          <Link
            href="/shop?sort=best-selling"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine inline-flex items-center gap-1 shrink-0"
          >
            All <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {products.length > 0 ? (
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
        >
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <div className="mb-3 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                <span className="text-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="h-px flex-1 bg-ink/15" />
              </div>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ animate: { transition: { staggerChildren: 0.09 } } }}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {fallbackEdits.map((edit, i) => (
            <motion.article
              key={edit.title}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="group relative overflow-hidden border border-ink/10 bg-beige-dark"
            >
              <Link href={edit.href} className="block aspect-[3/4]">
                <Image
                  src={edit.image}
                  alt={edit.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                />
                <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.2em] uppercase text-cream bg-ink/80 backdrop-blur-sm px-2 py-1">
                  EDIT · 0{i + 1}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent p-5">
                  <h3 className="font-display text-2xl tracking-[-0.02em] text-cream leading-none">{edit.title}</h3>
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-cream/60 mt-2">{edit.copy}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      )}
    </section>
  );
}
