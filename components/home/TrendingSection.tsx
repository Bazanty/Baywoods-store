"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { getFeaturedProducts } from "@/lib/data";
import ProductCard from "@/components/shop/ProductCard";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function TrendingSection() {
  const products = getFeaturedProducts().slice(0, 4);

  return (
    <section className="container-px mt-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-2">
            What&apos;s Hot
          </p>
          <h2 className="section-title">Trending Now</h2>
        </div>
        <Link
          href="/shop?sort=best-selling"
          className="text-xs font-medium tracking-widest uppercase text-forest hover:text-forest-dark transition-colors"
        >
          View All →
        </Link>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>
    </section>
  );
}
