import type { OrderStatus } from "./orderStatus";

export type Category =
  | "shoes"
  | "hoodies"
  | "jorts"
  | "joggers"
  | "sweatpants"
  | "shirts"
  | "caps"
  | "belts"
  | "accessories";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category;
  brand?: string;
  price: number;
  salePrice?: number;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  variants?: ProductVariant[];
  description: string;
  material?: string;
  materialCare?: string;
  badge?: "new" | "sale" | "hot";
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount?: number;
  verificationStatus?: ProductVerificationStatus;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
}

export type ProductVerificationStatus =
  | "PENDING"
  | "VERIFIED_ORIGINAL"
  | "NEEDS_REVIEW"
  | "REJECTED";

export interface ProductColor {
  name: string;
  hex: string;
}

// Resolved variant row used to map (size, color) → inventory variant_id.
export interface ProductVariant {
  id: string;
  size?: string;
  colorName?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: ProductColor;
  quantity: number;
  variantId?: string;
  selectedImage?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title?: string;
  body: string;
  verified: boolean;
  helpful: number;
  storeReply?: string;
  storeReplyAt?: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  trackingNumber?: string;
}

export interface FilterState {
  categories: Category[];
  brands: string[];
  sizes: string[];
  colors: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
}

export type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "best-selling"
  | "rating";
