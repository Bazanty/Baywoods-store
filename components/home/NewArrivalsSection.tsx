"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getNewArrivals } from "@/lib/supabase/queries";
import { productImages } from "@/lib/productImages";
import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

const fallbackDrops = [
  { title: "Jordan lows", href: "/shop/shoes", image: productImages.nike[1] },
  { title: "Adidas classics", href: "/shop/shoes", image: productImages.adidas[4] },
  { title: "New Balance runners", href: "/shop/shoes", image: productImages["new-balance"][12] },
  { title: "Vans staples", href: "/shop/shoes", image: productImages.vans[6] },
  { title: "Nike rotation", href: "/shop/shoes", image: productImages.nike[22] },
];

export default function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [progress, setProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNewArrivals(12)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [products]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLDivElement>("[data-slide]");
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: step * dir * 2, behavior: "smooth" });
  };

  const hasProducts = products.length > 0;
  const count = hasProducts ? products.length : fallbackDrops.length;

  return (
    <section className="relative mt-24 overflow-hidden bg-beige py-20 lg:mt-28 lg:py-28">
      {/* Oversized decorative backdrop type */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-4 select-none whitespace-nowrap text-center font-black uppercase leading-none tracking-tighter text-ink/[0.045]"
        style={{ fontSize: "clamp(6rem, 18vw, 22rem)" }}
      >
        New Arrivals
      </div>

      <div className="container-px relative">
        {/* Editorial header */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-ink/15 pb-8">
          <div className="col-span-6 lg:col-span-1">
            <span className="font-mono text-[11px] tracking-[0.2em] text-forest">
              ／01
            </span>
          </div>

          <div className="col-span-12 lg:col-span-7 lg:order-2">
            <p className="section-kicker mb-3 text-forest">Just landed</p>
            <h2 className="text-balance text-4xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-[3.75rem]">
              Fresh on the rail<span className="text-forest">.</span>
            </h2>
          </div>

          <div className="col-span-6 flex justify-end lg:col-span-1 lg:order-1">
            <span className="font-mono text-[11px] tracking-[0.2em] text-ink/40">
              {String(count).padStart(2, "0")} pairs
            </span>
          </div>

          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:order-3 lg:items-end">
            <p className="max-w-[28ch] text-sm leading-relaxed text-ink/70 lg:text-right">
              The newest pairs through the door — restocks, regional drops and
              first-look exclusives.
            </p>
            <Link
              href="/new-arrivals"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
            >
              <span className="border-b border-ink pb-0.5 transition-colors group-hover:border-forest group-hover:text-forest">
                See all arrivals
              </span>
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
          <span>Updated weekly</span>
          <span aria-hidden className="text-ink/25">/</span>
          <span>Free local delivery over 5K</span>
          <span aria-hidden className="text-ink/25">/</span>
          <span>Authenticated by Baywoods</span>
        </div>
      </div>

      {/* Scroll track */}
      <motion.div
        ref={trackRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 lg:scroll-px-12 lg:px-12"
      >
        {hasProducts
          ? products.map((product, i) => (
              <div
                key={product.id}
                data-slide
                className="group/slide w-[72vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[22vw] xl:w-[18vw]"
              >
                <div className="mb-3 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-ink/15" />
                  <span className="text-forest opacity-0 transition-opacity duration-300 group-hover/slide:opacity-100">
                    New
                  </span>
                </div>
                <ProductCard product={product} />
              </div>
            ))
          : fallbackDrops.map((drop, i) => (
              <div
                key={drop.title}
                data-slide
                className="group w-[72vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[22vw] xl:w-[18vw]"
              >
                <div className="mb-3 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-ink/15" />
                  <span>JIT</span>
                </div>
                <Link href={drop.href} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-light">
                    <Image
                      src={drop.image}
                      alt={drop.title}
                      fill
                      sizes="(max-width: 640px) 72vw, 25vw"
                      className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent p-4 text-cream">
                      <p className="text-sm font-semibold">{drop.title}</p>
                      <ArrowUpRight
                        size={15}
                        className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
      </motion.div>

      {/* Footer: progress + controls */}
      <div className="container-px relative mt-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative h-px flex-1 bg-ink/15">
            <div
              className="absolute inset-y-0 left-0 bg-forest transition-[width] duration-200 ease-out"
              style={{ width: `${Math.max(0.04, progress) * 100}%` }}
            />
          </div>

          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 sm:inline">
            {String(Math.round(progress * 100)).padStart(2, "0")}%
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="flex h-11 w-11 items-center justify-center border border-ink/20 bg-cream text-ink transition-all duration-300 hover:border-forest hover:bg-forest hover:text-cream"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="flex h-11 w-11 items-center justify-center border border-ink/20 bg-cream text-ink transition-all duration-300 hover:border-forest hover:bg-forest hover:text-cream"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}