"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/lib/types";
import { formatPrice, getDiscountPercent, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import Badge from "@/components/ui/Badge";

interface ProductCardProps {
  product: Product;
}

const cardVariant = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { toggleWishlist, isWishlisted, addItem } = useCartStore();
  const wishlisted = isWishlisted(product.id);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1];
  const hasSecondImage = Boolean(secondaryImage);
  const discount = product.salePrice
    ? getDiscountPercent(product.price, product.salePrice)
    : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultSize = product.sizes[Math.floor(product.sizes.length / 2)] ?? "One Size";
    const defaultColor = product.colors[0] ?? { name: "Default", hex: "#1E293B" };
    addItem(product, defaultSize, defaultColor);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  return (
    <motion.article
      variants={cardVariant}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative"
    >
      <div className="relative aspect-square bg-beige-dark overflow-hidden border border-ink/10">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                width={500}
                height={500}
                quality={90}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500 ease-out-expo",
                  hovered && hasSecondImage ? "opacity-0 scale-[1.04]" : "opacity-100 scale-100"
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 33vw, 25vw"
              />
              {hasSecondImage && secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  width={500}
                  height={500}
                  quality={90}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out-expo",
                    hovered ? "opacity-100 scale-100" : "opacity-0 scale-[1.04]"
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-beige-dark">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted/60">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Top-left: badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
          {product.verificationStatus === "VERIFIED_ORIGINAL" && <Badge variant="verified" />}
          {product.badge && <Badge variant={product.badge} />}
          {discount && product.badge !== "sale" && <Badge variant="sale" />}
        </div>

        {/* Top-right: wishlist */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center transition-all duration-200 border",
            wishlisted
              ? "bg-ink border-ink text-citrine"
              : "bg-cream/95 border-ink/15 text-ink hover:border-ink"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={13} className={cn(wishlisted && "fill-citrine")} />
        </button>

        {/* Bottom: quick add / sold out */}
        {!product.inStock ? (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-ink/90 py-2.5 text-center pointer-events-none">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-cream/80">
              Sold out
            </span>
          </div>
        ) : (
          <motion.button
            onClick={handleQuickAdd}
            initial={false}
            animate={{ y: hovered ? 0 : "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 right-0 z-10 bg-ink text-cream py-2.5 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-citrine hover:text-ink transition-colors"
          >
            <Plus size={11} strokeWidth={2.5} />
            Quick add
          </motion.button>
        )}

        {/* Stock warning */}
        {product.inStock && product.stockCount && product.stockCount <= 5 && (
          <div className="absolute bottom-10 left-2.5 z-10 pointer-events-none">
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink bg-citrine px-2 py-0.5">
              Only {product.stockCount} left
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <Link href={`/product/${product.slug}`} className="block mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted truncate">
            {product.category}
          </p>
          {/* color swatches — squares */}
          {product.colors.length > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  className="w-2.5 h-2.5 border border-ink/20"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="font-mono text-[9px] text-muted ml-0.5">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
        <h3 className="font-display text-base tracking-[-0.01em] text-ink group-hover:underline-citrine line-clamp-1 mt-1.5">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          {product.salePrice ? (
            <>
              <span className="price text-sm font-medium text-ink">
                {formatPrice(product.salePrice)}
              </span>
              <span className="price text-xs text-muted line-through">
                {formatPrice(product.price)}
              </span>
              {discount && (
                <span className="font-mono text-[10px] tracking-[0.16em] text-ink bg-citrine px-1.5 py-0.5">
                  -{discount}%
                </span>
              )}
            </>
          ) : (
            <span className="price text-sm font-medium text-ink">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
