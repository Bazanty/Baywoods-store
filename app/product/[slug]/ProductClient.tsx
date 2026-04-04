"use client";

import { useState } from "react";
import { Heart, Share2, Shield, Truck, RefreshCw, ChevronDown } from "lucide-react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { Product, Review } from "@/lib/types";
import ImageGallery from "@/components/product/ImageGallery";
import SizeSelector from "@/components/product/SizeSelector";
import ColorSelector from "@/components/product/ColorSelector";
import SizeGuideModal from "@/components/product/SizeGuideModal";
import ReviewSection from "@/components/product/ReviewSection";
import RelatedProducts from "@/components/product/RelatedProducts";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Props {
  product: Product;
  related: Product[];
  reviews: Review[];
}

export default function ProductClient({ product, related, reviews }: Props) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);

  const { addItem, toggleWishlist, isWishlisted } = useCartStore();
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor);
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  const accordions = [
    { key: "description", title: "Description", content: product.description },
    {
      key: "material",
      title: "Material & Care",
      content: "Machine wash cold, gentle cycle. Do not tumble dry. Iron on low heat.",
    },
    {
      key: "shipping",
      title: "Shipping & Returns",
      content:
        "Standard shipping: 3–7 business days. Express: 1–2 business days. Free shipping on orders over KSh 5,000. Returns accepted within 14 days of delivery.",
    },
  ];

  return (
    <>
      <div className="pt-20 lg:pt-24">
        <div className="container-px py-8">
          <nav className="text-xs text-muted mb-8 flex items-center gap-2">
            <a href="/" className="hover:text-ink transition-colors">Home</a>
            <span>/</span>
            <a href="/shop" className="hover:text-ink transition-colors">Shop</a>
            <span>/</span>
            <a href={`/shop/${product.category}`} className="hover:text-ink transition-colors capitalize">
              {product.category}
            </a>
            <span>/</span>
            <span className="text-ink">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">
            <ImageGallery images={product.images} productName={product.name} />

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start"
            >
              <div>
                {product.badge && <Badge variant={product.badge} className="mb-3" />}
                <h1 className="font-serif text-display-lg text-ink leading-tight">{product.name}</h1>

                <div className="flex items-center gap-2 mt-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < Math.round(product.rating) ? "fill-forest text-forest" : "text-stone fill-stone"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mt-4">
                  {product.salePrice ? (
                    <>
                      <span className="font-serif text-3xl font-semibold text-danger">
                        {formatPrice(product.salePrice)}
                      </span>
                      <span className="text-lg text-muted line-through">{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    <span className="font-serif text-3xl font-semibold text-ink">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>

                {product.stockCount && product.stockCount <= 10 && (
                  <p className="text-xs text-amber-600 font-medium mt-2">
                    Only {product.stockCount} left in stock
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

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || !selectedSize}
                  size="lg"
                  className="flex-1"
                >
                  {addedMsg ? "Added!" : !product.inStock ? "Out of Stock" : !selectedSize ? "Select a Size" : "Add to Cart"}
                </Button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-14 h-14 border flex items-center justify-center transition-colors ${
                    wishlisted ? "border-danger text-danger" : "border-stone text-ink hover:border-ink"
                  }`}
                >
                  <Heart size={18} className={wishlisted ? "fill-danger" : ""} />
                </button>
                <button
                  onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
                  className="w-14 h-14 border border-stone text-ink hover:border-ink flex items-center justify-center transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 py-5 border-t border-b border-stone">
                {[
                  { icon: Truck, text: "Free over KSh 5K" },
                  { icon: RefreshCw, text: "14-Day Returns" },
                  { icon: Shield, text: "Secure Checkout" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1 text-center">
                    <Icon size={16} className="text-forest" strokeWidth={1.5} />
                    <p className="text-[10px] text-muted">{text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-0">
                {accordions.map(({ key, title, content }) => (
                  <div key={key} className="border-b border-stone">
                    <button
                      onClick={() => setAccordionOpen(accordionOpen === key ? null : key)}
                      className="w-full flex items-center justify-between py-4 text-sm font-medium text-ink text-left"
                    >
                      {title}
                      <ChevronDown
                        size={15}
                        className={`text-muted transition-transform duration-200 ${accordionOpen === key ? "rotate-180" : ""}`}
                      />
                    </button>
                    {accordionOpen === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="pb-4"
                      >
                        <p className="text-sm text-muted leading-relaxed">{content}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="mt-20">
            <ReviewSection reviews={reviews} rating={product.rating} reviewCount={product.reviewCount} productId={product.id} />
          </div>

          <RelatedProducts products={related} />
        </div>
      </div>

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
