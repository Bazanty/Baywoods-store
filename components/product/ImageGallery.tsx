"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ZoomIn } from "lucide-react";

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
        {/* Thumbnails */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:max-h-[500px]">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 w-14 h-14 overflow-hidden border transition-colors",
                active === i ? "border-ink" : "border-stone hover:border-muted"
              )}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>

        {/* Main image — square aspect, capped at 500px so images never
            render larger than their Cloudinary source resolution */}
        <div
          className="flex-1 relative bg-beige-dark overflow-hidden group cursor-zoom-in"
          style={{ maxHeight: "500px", aspectRatio: "1 / 1" }}
          onClick={() => setZoomed(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
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

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 bg-ink/70 backdrop-blur-sm flex items-center justify-center text-white">
              <ZoomIn size={14} />
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
            className="fixed inset-0 bg-ink/90 z-[80] flex items-center justify-center p-8 cursor-zoom-out"
          >
            <div className="relative w-full max-w-lg aspect-square">
              <Image
                src={images[active]}
                alt={productName}
                fill
                quality={90}
                className="object-contain"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
