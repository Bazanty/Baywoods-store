"use client";

import { useState } from "react";
import { Heart, Shield, Truck, RefreshCw, ChevronDown, Star, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useCartStore, resolveVariant } from "@/lib/store";
import { Product, Review } from "@/lib/types";
import ImageGallery from "@/components/product/ImageGallery";
import SizeSelector from "@/components/product/SizeSelector";
import ColorSelector from "@/components/product/ColorSelector";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import ReviewSection from "@/components/product/ReviewSection";
import RelatedProducts from "@/components/product/RelatedProducts";
import NotifyMeForm from "@/components/product/NotifyMeForm";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import ShareButton from "@/components/product/ShareButton";
import Badge from "@/components/ui/Badge";

interface Props {
  product: Product;
  related: Product[];
  reviews: Review[];
}

export default function ProductClient({ product, related, reviews }: Props) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0] ?? { name: "Default", hex: "#1E293B" }
  );
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<string | null>("description");

  const { addItem, toggleWishlist, isWishlisted } = useCartStore();
  const wishlisted = isWishlisted(product.id);

  // Resolve the concrete variant for the current selection up front — this is
  // the row that drives inventory and pricing, so the cart should never carry a
  // line we couldn't pin to one (unless the product simply has no variants).
  const selectedVariant = resolveVariant(product, selectedSize, selectedColor.name);
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    if (hasVariants && !selectedVariant) return;
    addItem(product, selectedSize, selectedColor, selectedVariant);
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  const accordions = [
    { key: "description", n: "01", title: "Description", content: product.description },
    {
      key: "material",
      n: "02",
      title: "Material & Care",
      content:
        product.materialCare?.trim() ||
        "Machine wash cold, gentle cycle. Do not tumble dry. Iron on low heat.",
    },
    {
      key: "shipping",
      n: "03",
      title: "Shipping & Returns",
      content:
        "Standard shipping: 3–7 business days. Express: 1–2 business days. Free shipping on orders over KSh 5,000. Returns accepted within 14 days of delivery.",
    },
  ];

  const buttonLabel = addedMsg
    ? "Added to bag"
    : !product.inStock
    ? "Out of stock"
    : !selectedSize
    ? "Select a size"
    : hasVariants && !selectedVariant
    ? "Unavailable in this combo"
    : "Add to bag";

  return (
    <>
      <div className="pt-20 lg:pt-24">
        <div className="container-px py-8">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-muted overflow-x-auto no-scrollbar">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <span aria-hidden>→</span>
            <Link href="/shop" className="hover:text-ink transition-colors">Shop</Link>
            <span aria-hidden>→</span>
            <Link href={`/shop/${product.category}`} className="hover:text-ink transition-colors capitalize">
              {product.category}
            </Link>
            <span aria-hidden>→</span>
            <span className="text-ink truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">
            <ImageGallery images={product.images} productName={product.name} />

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-7 lg:sticky lg:top-24 lg:self-start"
            >
              {/* Title block */}
              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {product.verificationStatus === "VERIFIED_ORIGINAL" && <Badge variant="verified" />}
                  {product.badge && <Badge variant={product.badge} />}
                </div>

                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-2">
                  / {product.category.toUpperCase()}
                </p>

                <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.96] text-ink text-4xl sm:text-5xl">
                  {product.name}
                </h1>

                {/* Rating row */}
                <div className="flex items-center gap-3 mt-4 pb-4 border-b border-ink/15">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.round(product.rating) ? "fill-ink text-ink" : "text-ink/20 fill-ink/20"}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                    {product.rating} · {product.reviewCount} reviews
                  </span>
                </div>

                {/* Price block */}
                <div className="flex items-baseline justify-between mt-5">
                  <div className="flex items-baseline gap-3">
                    {product.salePrice ? (
                      <>
                        <span className="price font-display text-4xl font-medium tracking-[-0.02em] text-ink">
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className="price text-lg text-muted line-through">{formatPrice(product.price)}</span>
                      </>
                    ) : (
                      <span className="price font-display text-4xl font-medium tracking-[-0.02em] text-ink">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
                    incl. VAT
                  </span>
                </div>

                {product.stockCount && product.stockCount <= 10 && (
                  <p className="mt-3 inline-block font-mono text-[10px] tracking-[0.16em] uppercase text-ink bg-citrine px-2 py-1">
                    Only {product.stockCount} left
                  </p>
                )}
              </div>

              <ColorSelector colors={product.colors} selected={selectedColor} onSelect={setSelectedColor} />
              <SizeSelector
                sizes={product.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
                onGuideOpen={() => setSizeGuideOpen(true)}
              />

              {!product.inStock && (
                <NotifyMeForm
                  productId={product.id}
                  // Only bind to a specific variant once a size is actually
                  // chosen — otherwise subscribe at the product level (null) so
                  // any variant coming back triggers the notification.
                  variantId={
                    selectedSize
                      ? product.variants?.find(
                          (v) =>
                            v.size === selectedSize &&
                            (!selectedColor?.name || v.colorName === selectedColor.name)
                        )?.id ?? null
                      : null
                  }
                />
              )}

              {/* Add-to-bag bar */}
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || !selectedSize || (hasVariants && !selectedVariant)}
                  className="flex-1 h-14 bg-ink text-cream font-mono text-xs tracking-[0.18em] uppercase transition-all hover:bg-forest-dark active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  <AnimatePresence mode="wait">
                    {addedMsg ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-2 text-citrine"
                      >
                        <Check size={14} /> {buttonLabel}
                      </motion.span>
                    ) : (
                      <motion.span
                        key={buttonLabel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {buttonLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-14 h-14 border flex items-center justify-center transition-colors ${
                    wishlisted ? "bg-ink border-ink text-citrine" : "border-ink/25 text-ink hover:border-ink"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart size={16} className={wishlisted ? "fill-citrine" : ""} />
                </button>
                <ShareButton
                  title={product.name}
                  image={product.images?.[0]}
                  productCategory={product.category}
                />
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-3 border-t border-b border-ink/15 divide-x divide-ink/15">
                {[
                  { icon: Truck, t: "Free over KSh 5K", s: "dispatch" },
                  { icon: RefreshCw, t: "14-Day returns", s: "policy" },
                  { icon: Shield, t: "Secure checkout", s: "M-Pesa STK" },
                ].map(({ icon: Icon, t, s }) => (
                  <div key={t} className="flex flex-col items-start gap-2 py-4 px-3 first:pl-0">
                    <Icon size={14} strokeWidth={1.5} className="text-ink" />
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink leading-tight">{t}</p>
                      <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mt-1">{s}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Accordions */}
              <div className="space-y-0 -mt-2">
                {accordions.map(({ key, n, title, content }) => (
                  <div key={key} className="border-b border-ink/15">
                    <button
                      onClick={() => setAccordionOpen(accordionOpen === key ? null : key)}
                      className="w-full flex items-center justify-between py-4 text-left group"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                          {n}
                        </span>
                        <span className="font-display text-base tracking-[-0.01em] text-ink">{title}</span>
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-muted transition-transform duration-200 ${accordionOpen === key ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {accordionOpen === key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 text-sm leading-relaxed text-ink/75">{content}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="mt-24">
            <ReviewSection reviews={reviews} rating={product.rating} reviewCount={product.reviewCount} productId={product.id} />
          </div>

          <RelatedProducts products={related} />

          <RecentlyViewed trackSlug={product.slug} />
        </div>
      </div>

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
