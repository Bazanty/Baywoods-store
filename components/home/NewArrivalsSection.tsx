"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getNewArrivals } from "@/lib/supabase/queries";
import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

export default function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getNewArrivals(4).then(setProducts).catch(() => setProducts([]));
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="mt-24 py-16 bg-beige-dark">
      <div className="container-px">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-2">
              Just Landed
            </p>
            <h2 className="section-title">New Arrivals</h2>
          </div>
          <Link
            href="/new-arrivals"
            className="text-xs font-medium tracking-widest uppercase text-forest hover:text-forest-dark transition-colors"
          >
            See All →
          </Link>
        </div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
