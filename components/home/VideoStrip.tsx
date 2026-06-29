"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getCldVideoUrl, getCldImageUrl } from "next-cloudinary";
import { featuredVideos, type FeaturedVideo } from "@/lib/featuredVideos";

const ease = [0.22, 1, 0.36, 1] as const;

// A tasteful slice of the reel — the full set lives in lib/featuredVideos.ts.
const REEL = featuredVideos.slice(0, 8);

const posterUrl = (v: FeaturedVideo) =>
  getCldImageUrl({ src: v.publicId, assetType: "video", format: "jpg", width: 480, crop: "fill" });

const clipUrl = (v: FeaturedVideo) => getCldVideoUrl({ src: v.publicId, width: 480 });

function ReelTile({
  video,
  index,
  scrollRef,
  reduceMotion,
}: {
  video: FeaturedVideo;
  index: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  reduceMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay only the clip(s) actually in view, scoped to the horizontal
  // strip so off-screen tiles never fire. Skipped entirely for reduced motion.
  useEffect(() => {
    if (reduceMotion) return;
    const el = videoRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { root: scrollRef.current ?? null, threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion, scrollRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index, 4) * 0.07, ease }}
      className="relative shrink-0 snap-start overflow-hidden bg-stone-light"
      style={{ width: "clamp(180px, 24vw, 260px)", aspectRatio: "9 / 16" }}
    >
      <video
        ref={videoRef}
        src={clipUrl(video)}
        poster={posterUrl(video)}
        muted
        loop
        playsInline
        preload="none"
        // Reduced motion: poster shows, nothing autoplays — controls let the
        // visitor start it on their own terms.
        controls={reduceMotion}
        aria-label={video.label}
        className="h-full w-full object-cover"
      />
    </motion.div>
  );
}

export default function VideoStrip() {
  const reduceMotion = useReducedMotion() ?? false;
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="mt-28 overflow-hidden">
      <div className="container-px mb-8 grid grid-cols-12 items-end gap-4 border-b border-ink/15 pb-6">
        <div className="col-span-12 sm:col-span-9">
          <h2 className="section-title">In motion.</h2>
        </div>
        <Link
          href="/shop"
          className="col-span-12 sm:col-span-3 sm:justify-self-end inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine transition-colors"
        >
          Shop the looks <ArrowUpRight size={12} />
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-px-4 snap-x snap-mandatory pl-4 sm:pl-6 lg:pl-10 xl:pl-16 pr-4 sm:pr-6 lg:pr-10 xl:pr-16 no-scrollbar pb-2"
      >
        {REEL.map((v, i) => (
          <ReelTile key={v.publicId} video={v} index={i} scrollRef={scrollRef} reduceMotion={reduceMotion} />
        ))}
      </div>
    </section>
  );
}
