import type { CreateOrderPayload, ResolvedItem } from "../../lib/orderPricing";

// A complete, valid order payload. Tests override only the fields they care
// about (usually `items`, `couponCode`, `shippingMethod`, or the tampered
// `total`/`subtotal`).
export function buildOrderPayload(
  overrides: Partial<CreateOrderPayload> = {}
): CreateOrderPayload {
  return {
    email: "shopper@example.com",
    phone: "0712345678",
    shippingAddress: {
      firstName: "Amani",
      lastName: "Otieno",
      address: "12 Riverside Drive",
      city: "Nairobi",
      county: "Nairobi",
    },
    shippingMethod: "standard",
    items: [],
    ...overrides,
  };
}

// A resolved order line as `validateReservedStock` expects to receive it.
export function buildResolvedItem(overrides: Partial<ResolvedItem> = {}): ResolvedItem {
  return {
    productId: "prod-1",
    variantId: null,
    productName: "Coastal Hoodie",
    variantName: "",
    unitPrice: 1000,
    quantity: 1,
    lineTotal: 1000,
    ...overrides,
  };
}
