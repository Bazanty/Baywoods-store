"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Link as LinkIcon, Check, MessageCircle, Facebook, X as XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  url?: string;
  image?: string;
  productCategory?: string;
}

export default function ShareButton({ title, url, image, productCategory }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(url ?? "");
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!url && typeof window !== "undefined") setShareUrl(window.location.href);
  }, [url]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const message = `${title}${productCategory ? ` · ${productCategory}` : ""}`;

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      setOpen((v) => !v);
      return;
    }
    try {
      await navigator.share({ title, text: message, url: shareUrl });
    } catch {
      setOpen((v) => !v);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const enc = encodeURIComponent;
  const links = {
    whatsapp: `https://wa.me/?text=${enc(`${message} ${shareUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
    x: `https://twitter.com/intent/tweet?text=${enc(message)}&url=${enc(shareUrl)}`,
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleNativeShare}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        title="Share"
        aria-label="Share this product"
        className="w-14 h-14 border border-ink/25 text-ink hover:border-ink flex items-center justify-center transition-colors"
      >
        <Share2 size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
            className="absolute right-0 bottom-full mb-2 w-60 bg-cream border border-ink/15 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] z-30"
            role="menu"
          >
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted px-4 pt-3 pb-2 border-b border-ink/10">
              / Share
            </p>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-beige-dark text-left transition-colors"
              role="menuitem"
            >
              <span className="flex items-center gap-3">
                {copied ? (
                  <Check size={14} className="text-citrine bg-ink" />
                ) : (
                  <LinkIcon size={14} className="text-ink" />
                )}
                <span className="font-display text-sm text-ink">{copied ? "Link copied" : "Copy link"}</span>
              </span>
            </button>
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-beige-dark transition-colors"
              role="menuitem"
            >
              <MessageCircle size={14} className="text-ink" />
              <span className="font-display text-sm text-ink">WhatsApp</span>
            </a>
            <a
              href={links.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-beige-dark transition-colors"
              role="menuitem"
            >
              <Facebook size={14} className="text-ink" />
              <span className="font-display text-sm text-ink">Facebook</span>
            </a>
            <a
              href={links.x}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-beige-dark transition-colors"
              role="menuitem"
            >
              <XIcon size={14} className="text-ink" />
              <span className="font-display text-sm text-ink">X</span>
            </a>
            <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted px-4 py-2 border-t border-ink/10">
              / {image ? "Image will preview on supported networks" : "Right-click to reopen"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
