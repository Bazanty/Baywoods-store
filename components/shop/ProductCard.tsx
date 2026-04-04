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
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { toggleWishlist, isWishlisted, addItem } = useCartStore();
  const wishlisted = isWishlisted(product.id);
  const hasSecondImage = product.images.length > 1;
  const discount = product.salePrice
    ? getDiscountPercent(product.price, product.salePrice)
    : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultSize = product.sizes[Math.floor(product.sizes.length / 2)];
    addItem(product, defaultSize, product.colors[0]);
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
      {/* Image container — link covers images only, interactive buttons are siblings */}
      <div className="relative aspect-[3/4] bg-beige-dark overflow-hidden">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-all duration-500 ease-out-expo",
              hovered && hasSecondImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
          {hasSecondImage && (
            <Image
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              fill
              className={cn(
                "object-cover transition-all duration-500 ease-out-expo",
                hovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {product.badge && <Badge variant={product.badge} />}
          {discount && product.badge !== "sale" && <Badge variant="sale" />}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={14}
            className={cn(
              "transition-colors",
              wishlisted ? "fill-danger text-danger" : "text-ink"
            )}
          />
        </button>

        {/* Quick add / Sold out */}
        {!product.inStock ? (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-stone/90 backdrop-blur-sm py-2.5 text-center pointer-events-none">
            <span className="text-xs font-medium text-muted tracking-wide">Sold Out</span>
          </div>
        ) : (
          <motion.button
            onClick={handleQuickAdd}
            initial={false}
            animate={{ y: hovered ? 0 : "100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 right-0 z-10 bg-ink text-white py-2.5 flex items-center justify-center gap-2 text-xs font-medium tracking-wide hover:bg-forest transition-colors"
          >
            <Plus size={12} />
            Quick Add
          </motion.button>
        )}

        {/* Stock warning */}
        {product.inStock && product.stockCount && product.stockCount <= 5 && (
          <div className="absolute bottom-10 left-3 z-10 pointer-events-none">
            <span className="text-[10px] font-medium text-white bg-amber-500 px-2 py-0.5">
              Only {product.stockCount} left
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <Link href={`/product/${product.slug}`} className="block mt-3 space-y-1">
        <p className="text-[10px] font-medium tracking-widest uppercase text-muted">
          {product.category}
        </p>
        <h3 className="text-sm font-medium text-ink group-hover:text-forest transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-sm font-semibold text-danger">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-xs text-muted line-through">
                {formatPrice(product.price)}
              </span>
              {discount && (
                <span className="text-[10px] font-semibold text-danger">
                  -{discount}%
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-semibold text-ink">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 pt-1">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color.name}
              title={color.name}
              className="w-3 h-3 rounded-full border border-stone/70"
              style={{ backgroundColor: color.hex }}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-muted">+{product.colors.length - 4}</span>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
