"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const cats = [
  {
    slug: "shoes",
    label: "Shoes",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    span: "col-span-2 row-span-2",
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    slug: "caps",
    label: "Caps",
    img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    slug: "joggers",
    label: "Joggers",
    img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    slug: "accessories",
    label: "Accessories",
    img: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
    span: "col-span-1 row-span-1",
  },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function CategoryGrid() {
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
