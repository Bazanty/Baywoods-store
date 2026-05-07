"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { heroImages } from "@/lib/heroImages";

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

interface TrailItem {
  id: number;
  x: number;
  y: number;
  src: string;
  rot: number;
}

const SPAWN_DISTANCE = 130;
const TRAIL_LIFETIME = 1100;

const HIGHLIGHTS = [
  { value: "276", label: "editorial looks" },
  { value: "M-Pesa", label: "checkout ready" },
  { value: "24h", label: "Nairobi dispatch" },
];

const STYLE_TAGS = ["Sneakers", "Denim", "Varsity", "Late city", "Daily wear"];

const TICKER_ITEMS = [
  "New arrivals weekly",
  "Authentic pairs only",
  "M-Pesa accepted",
  "Curated streetwear edit",
  "Nairobi ready delivery",
  "Fresh campaign visuals",
];

export default function Hero() {
  const [trailImages] = useState(() => shuffle(heroImages));
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const counter = useRef(0);
  const imgIdx = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const timeoutIds = useRef<number[]>([]);
  const [isHoverDevice, setIsHoverDevice] = useState(false);

  useEffect(() => {
    setIsHoverDevice(window.matchMedia("(hover: hover)").matches);
  }, []);

  useEffect(() => {
    if (trailImages.length < 2) return;
    const id = window.setInterval(() => {
      setFeaturedIdx((c) => (c + 1) % trailImages.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [trailImages.length]);

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (trailImages.length === 0) return null;

  const leadImage = trailImages[featuredIdx % trailImages.length];
  const supportImageA = trailImages[(featuredIdx + 11) % trailImages.length];
  const supportImageB = trailImages[(featuredIdx + 23) % trailImages.length];
  const detailImage = trailImages[(featuredIdx + 37) % trailImages.length];
  const previewImages = [
    trailImages[(featuredIdx + 3) % trailImages.length],
    trailImages[(featuredIdx + 9) % trailImages.length],
    trailImages[(featuredIdx + 15) % trailImages.length],
    trailImages[(featuredIdx + 21) % trailImages.length],
  ];
  const bottomStripImages = [
    trailImages[(featuredIdx + 27) % trailImages.length],
    trailImages[(featuredIdx + 31) % trailImages.length],
    trailImages[(featuredIdx + 35) % trailImages.length],
    trailImages[(featuredIdx + 39) % trailImages.length],
    trailImages[(featuredIdx + 43) % trailImages.length],
  ];

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!isHoverDevice) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect || event.clientX - rect.left < rect.width * 0.45) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!lastPos.current) {
      lastPos.current = { x, y };
      return;
    }
    const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
    if (dist < SPAWN_DISTANCE) return;
    lastPos.current = { x, y };
    const id = (counter.current += 1);
    const src = trailImages[(featuredIdx + imgIdx.current * 3) % trailImages.length];
    imgIdx.current += 1;
    const rot = (Math.random() - 0.5) * 18;
    setTrail((c) => [...c, { id, x, y, src, rot }]);
    const timeoutId = window.setTimeout(() => {
      setTrail((c) => c.filter((item) => item.id !== id));
      timeoutIds.current = timeoutIds.current.filter((e) => e !== timeoutId);
    }, TRAIL_LIFETIME);
    timeoutIds.current.push(timeoutId);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        lastPos.current = null;
      }}
      className="relative isolate min-h-screen overflow-hidden bg-white"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50" />

      {/* Mouse trail – same functionality, lighter styling */}
      <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden>
        <AnimatePresence>
          {trail.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8, rotate: item.rot * 0.3 }}
              animate={{ opacity: 0.7, scale: 1, rotate: item.rot }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute"
              style={{
                left: item.x,
                top: item.y,
                width: 140,
                height: 180,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white/80 p-1 shadow-lg backdrop-blur-sm">
                <Image src={item.src} alt="" fill sizes="140px" className="object-cover" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main container */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          {/* Left column – text content */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-500"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gray-800" />
              Drop 01 / Nairobi
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
            >
              BAYWOODS
              <span className="mt-3 block text-base font-medium uppercase tracking-[0.3em] text-gray-500 sm:text-lg">
                Streetwear with Nairobi pace
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 max-w-md text-lg leading-relaxed text-gray-600"
            >
              Premium sneakers, layered basics, and after-dark staples. Curated for the fast, local checkout flow.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
              >
                Shop the drop
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href="/new-arrivals"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                New arrivals
                <ArrowUpRight size={16} strokeWidth={2} />
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-xs font-medium uppercase tracking-wider text-gray-400"
            >
              Move across the gallery on desktop to explore more looks.
            </motion.p>

            {/* Stats row – cleaner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-12 grid grid-cols-3 gap-4 border-t border-gray-100 pt-8"
            >
              {HIGHLIGHTS.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Style tags – subtle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {STYLE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Preview strip – simplified */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-10 rounded-2xl border border-gray-100 bg-gray-50/50 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Recent drops
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {previewImages.map((src, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-100"
                  >
                    <Image
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column – hero gallery (cleaner layout) */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xl"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={leadImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={leadImage}
                    alt="Hero"
                    fill
                    priority
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-800 backdrop-blur-sm">
                Lookbook frame 0{(featuredIdx % 9) + 1}
              </div>
            </motion.div>

            {/* Floating support cards – minimal */}
            <div className="absolute -bottom-8 -left-8 w-2/5">
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                <div className="relative aspect-[4/5]">
                  <Image src={supportImageA} alt="Support" fill className="object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Street edit
                  </p>
                  <p className="mt-1 text-sm text-gray-600">Clean layers, heavy sneakers.</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-6 top-1/3 hidden w-1/3 -translate-y-1/2 sm:block">
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                <div className="relative aspect-[3/4]">
                  <Image src={detailImage} alt="Detail" fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom image strip – simplified */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
          <div className="grid grid-cols-5 gap-2">
            {bottomStripImages.map((src, idx) => (
              <div key={idx} className="group relative aspect-[5/4] overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={src}
                  alt={`Frame ${idx + 1}`}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticker – same but cleaner */}
      <div className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-4 md:px-8">
          <div className="flex min-w-max animate-ticker gap-8 text-xs font-medium uppercase tracking-wider text-gray-400">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
              <span key={idx} className="flex items-center gap-8">
                {item}
                <span className="h-1 w-1 rounded-full bg-gray-300" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}