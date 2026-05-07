"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getNewArrivals } from "@/lib/supabase/queries";
import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

export default function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNewArrivals(12).then(setProducts).catch(() => setProducts([]));
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLDivElement>("[data-slide]");
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: step * dir * 2, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="mt-28 py-20 bg-beige-dark">
      <div className="container-px">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-2">
              Just landed
            </p>
            <h2 className="section-title">New Arrivals</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scrollBy(-1)}
                aria-label="Scroll left"
                className="w-10 h-10 rounded-full border border-stone/70 bg-cream text-ink flex items-center justify-center hover:border-ink hover:bg-ink hover:text-cream transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label="Scroll right"
                className="w-10 h-10 rounded-full border border-stone/70 bg-cream text-ink flex items-center justify-center hover:border-ink hover:bg-ink hover:text-cream transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <Link
              href="/new-arrivals"
              className="text-xs font-medium tracking-widest uppercase text-forest hover:text-forest-dark transition-colors"
            >
              See All →
            </Link>
          </div>
        </div>
      </div>

      {/* Slider track — bleeds past the container so cards peek off the edges */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        ref={trackRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-6 lg:scroll-px-12 pl-6 lg:pl-12 pr-6 lg:pr-12 no-scrollbar"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-slide
            className="snap-start shrink-0 w-[68vw] sm:w-[42vw] md:w-[30vw] lg:w-[22vw] xl:w-[18vw]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
