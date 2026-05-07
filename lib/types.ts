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
  price: number;
  salePrice?: number;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  variants?: ProductVariant[];
  description: string;
  material?: string;
  badge?: "new" | "sale" | "hot";
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount?: number;
}

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
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  verified: boolean;
  helpful: number;
}

export interface Order {
  id: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: CartItem[];
  total: number;
  trackingNumber?: string;
}

export interface FilterState {
  categories: Category[];
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
