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
    copy: "Jordan lows, Dunks, Forces, and everyday staples.",
  },
  {
    title: "Neutral runners",
    href: "/shop/shoes",
    image: productImages["new-balance"][8],
    copy: "New Balance, Adidas, easy silhouettes for daily wear.",
  },
  {
    title: "After-dark layers",
    href: "/shop/hoodies",
    image: productImages.vans[8],
    copy: "Fleece, cargos, caps, and heavier pieces for night plans.",
  },
];

const stagger = { animate: { transition: { staggerChildren: 0.09 } } };
const cardVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function TrendingSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getFeaturedProducts(4).then(setProducts).catch(() => setProducts([]));
  }, []);

  return (
    <section className="container-px mt-20 lg:mt-24">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker mb-2">Trending now</p>
          <h2 className="section-title">The current rotation.</h2>
        </div>
        <Link
          href="/shop?sort=best-selling"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest transition-colors hover:text-forest-dark"
        >
          View all
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {products.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      ) : (
        /* Fallback: full-image overlay cards — editorial, no white card body */
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-px sm:grid-cols-3 bg-stone"
        >
          {fallbackEdits.map((edit) => (
            <motion.article
              key={edit.title}
              variants={cardVariant}
              className="group relative overflow-hidden bg-stone-light"
            >
              <Link href={edit.href} className="block aspect-[3/4]">
                <Image
                  src={edit.image}
                  alt={edit.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/75 via-neutral-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-serif text-3xl leading-none text-white">{edit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{edit.copy}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                    Shop now <ArrowUpRight size={13} />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      )}
    </section>
  );
}
