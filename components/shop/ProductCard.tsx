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

const FALLBACK_PRODUCT_IMAGE =
  "https://res.cloudinary.com/dltbrta8h/image/upload/v1775887092/baywoodstore/nike/ak9wc1v6af5lvckiithw.jpg";

export default function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { toggleWishlist, isWishlisted, addItem } = useCartStore();
  const wishlisted = isWishlisted(product.id);
  const primaryImage = product.images[0] ?? FALLBACK_PRODUCT_IMAGE;
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
      <div className="relative aspect-square bg-beige-dark overflow-hidden">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0">
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
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {product.badge && <Badge variant={product.badge} />}
          {discount && product.badge !== "sale" && <Badge variant="sale" />}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white [&>svg]:text-neutral-800"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={14}
            className={cn(
              "transition-colors",
              wishlisted ? "fill-danger text-danger" : "text-neutral-800"
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
            className="absolute bottom-0 left-0 right-0 z-10 bg-neutral-900 text-white py-2.5 flex items-center justify-center gap-2 text-xs font-medium tracking-wide hover:bg-forest transition-colors"
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
