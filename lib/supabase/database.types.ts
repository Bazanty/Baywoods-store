// Hand-crafted types matching schema.sql
// To auto-generate: npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts

export type UserRole = "customer" | "admin" | "staff";
export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "shipped"
  | "delivered" | "cancelled" | "refunded";
export type PaymentStatus =
  | "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type PaymentMethod =
  | "card" | "bank_transfer" | "paypal" | "crypto" | "cash_on_delivery";
export type AddressType = "shipping" | "billing" | "both";
export type DiscountType = "percentage" | "fixed";

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string; email: string; password_hash: string;
  first_name: string; last_name: string; phone: string | null;
  role: UserRole; is_verified: boolean; is_active: boolean;
  created_at: string; updated_at: string;
}
export type UserInsert = Omit<UserRow, "id" | "created_at" | "updated_at">;

export interface CategoryRow {
  id: string; parent_id: string | null; name: string; slug: string;
  description: string | null; image_url: string | null; sort_order: number;
  is_active: boolean; created_at: string; updated_at: string;
}
export type CategoryInsert = Omit<CategoryRow, "id" | "created_at" | "updated_at">;

export interface ProductRow {
  id: string; category_id: string | null; name: string; slug: string;
  description: string | null; short_description: string | null;
  base_price: number; compare_price: number | null; sku: string | null;
  weight_kg: number | null; is_active: boolean; is_featured: boolean;
  meta_title: string | null; meta_description: string | null;
  created_at: string; updated_at: string;
}
export type ProductInsert = Omit<ProductRow, "id" | "created_at" | "updated_at">;

export interface ProductVariantRow {
  id: string; product_id: string; name: string; sku: string | null;
  price: number | null; weight_kg: number | null; sort_order: number;
  is_active: boolean; created_at: string;
}
export type ProductVariantInsert = Omit<ProductVariantRow, "id" | "created_at">;

export interface VariantOptionRow {
  id: string; variant_id: string; option_name: string; option_value: string;
}
export type VariantOptionInsert = Omit<VariantOptionRow, "id">;

export interface ProductImageRow {
  id: string; product_id: string; variant_id: string | null;
  url: string; alt_text: string | null; sort_order: number; is_primary: boolean;
}
export type ProductImageInsert = Omit<ProductImageRow, "id">;

export interface InventoryRow {
  id: string; product_id: string; variant_id: string | null;
  quantity: number; reserved: number; reorder_threshold: number; updated_at: string;
}
export type InventoryInsert = Omit<InventoryRow, "id" | "updated_at">;

export interface CouponRow {
  id: string; code: string; description: string | null;
  discount_type: DiscountType; discount_value: number; minimum_order: number;
  max_uses: number | null; used_count: number; per_user_limit: number;
  is_active: boolean; starts_at: string; expires_at: string | null; created_at: string;
}
export type CouponInsert = Omit<CouponRow, "id" | "created_at">;

export interface OrderRow {
  id: string; user_id: string | null; status: OrderStatus;
  shipping_name: string; shipping_line1: string; shipping_line2: string | null;
  shipping_city: string; shipping_state: string | null;
  shipping_postal: string; shipping_country: string; shipping_phone: string | null;
  subtotal: number; discount_amount: number; shipping_cost: number;
  tax_amount: number; total: number; coupon_id: string | null;
  notes: string | null; tracking_number: string | null;
  shipped_at: string | null; delivered_at: string | null; cancelled_at: string | null;
  created_at: string; updated_at: string;
}
export type OrderInsert = Omit<OrderRow, "id" | "created_at" | "updated_at">;

export interface OrderItemRow {
  id: string; order_id: string; product_id: string | null; variant_id: string | null;
  product_name: string; variant_name: string | null; sku: string | null;
  unit_price: number; quantity: number; line_total: number;
}
export type OrderItemInsert = Omit<OrderItemRow, "id">;

export interface PaymentRow {
  id: string; order_id: string; status: PaymentStatus; method: PaymentMethod;
  amount: number; currency: string; provider_tx_id: string | null;
  provider_response: Record<string, unknown> | null;
  paid_at: string | null; refunded_at: string | null; refund_amount: number | null;
  created_at: string; updated_at: string;
}
export type PaymentInsert = Omit<PaymentRow, "id" | "created_at" | "updated_at">;

export interface ReviewRow {
  id: string; product_id: string; user_id: string | null; order_id: string | null;
  rating: number; title: string | null; body: string | null;
  is_verified: boolean; is_approved: boolean; created_at: string;
}
export type ReviewInsert = Omit<ReviewRow, "id" | "created_at">;

export interface AddressRow {
  id: string; user_id: string; type: AddressType;
  full_name: string; phone: string | null; line1: string; line2: string | null;
  city: string; state: string | null; postal_code: string; country_code: string;
  is_default: boolean; created_at: string;
}
export type AddressInsert = Omit<AddressRow, "id" | "created_at">;

// ---------------------------------------------------------------------------
// Database shape — GenericSchema compatible (requires Relationships on each table)
// ---------------------------------------------------------------------------

type T<R, I, U = Partial<I>> = { Row: R; Insert: I; Update: U; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      users:            T<UserRow,           UserInsert>;
      addresses:        T<AddressRow,        AddressInsert>;
      categories:       T<CategoryRow,       CategoryInsert>;
      products:         T<ProductRow,        ProductInsert>;
      product_variants: T<ProductVariantRow, ProductVariantInsert>;
      variant_options:  T<VariantOptionRow,  VariantOptionInsert>;
      product_images:   T<ProductImageRow,   ProductImageInsert>;
      inventory:        T<InventoryRow,      InventoryInsert>;
      coupons:          T<CouponRow,         CouponInsert>;
      orders:           T<OrderRow,          OrderInsert>;
      order_items:      T<OrderItemRow,      OrderItemInsert>;
      payments:         T<PaymentRow,        PaymentInsert>;
      reviews:          T<ReviewRow,         ReviewInsert>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      address_type: AddressType;
      discount_type: DiscountType;
    };
    CompositeTypes: Record<string, never>;
  };
}
