"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ZoomIn, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <div className="flex flex-col-reverse lg:flex-row gap-3">
        {/* Thumbnails — square, hairline border, mono index */}
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:max-h-[520px]">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 w-14 h-14 overflow-hidden border transition-colors group",
                active === i ? "border-ink" : "border-ink/15 hover:border-ink/60"
              )}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="56px"
              />
              <span className={cn(
                "absolute bottom-0 left-0 font-mono text-[9px] px-1 tracking-[0.12em]",
                active === i ? "bg-ink text-citrine" : "bg-cream/90 text-muted"
              )}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>

        {/* Main image */}
        <div
          className="flex-1 relative bg-beige-dark overflow-hidden group cursor-zoom-in border border-ink/10"
          style={{ maxHeight: "520px", aspectRatio: "1 / 1" }}
          onClick={() => setZoomed(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 p-4"
            >
              <Image
                src={images[active]}
                alt={`${productName} — image ${active + 1}`}
                fill
                priority
                quality={85}
                className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 480px"
              />
            </motion.div>
          </AnimatePresence>

          {/* Frame counter — top-left */}
          <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.18em] uppercase text-cream bg-ink/85 px-2 py-1">
            FR · {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </div>

          {/* Zoom — top-right */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 bg-ink text-citrine flex items-center justify-center">
              <ZoomIn size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 bg-ink/95 z-[80] flex items-center justify-center p-8 cursor-zoom-out"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
              className="absolute top-4 right-4 w-10 h-10 border border-cream/30 text-cream hover:bg-cream hover:text-ink transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.2em] uppercase text-cream">
              FR · {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </div>
            <div className="relative w-full max-w-xl aspect-square">
              <Image
                src={images[active]}
                alt={productName}
                fill
                quality={90}
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 640px"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
