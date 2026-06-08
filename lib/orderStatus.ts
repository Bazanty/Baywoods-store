export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  VERIFICATION_PENDING: "Verification pending",
  VERIFIED: "Verified",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "border border-ink/30 text-ink",
  PAID: "bg-ink text-citrine",
  VERIFICATION_PENDING: "border border-ink/30 text-ink",
  VERIFIED: "bg-citrine text-ink",
  PACKED: "border border-ink text-ink",
  OUT_FOR_DELIVERY: "bg-ink text-cream",
  DELIVERED: "bg-citrine text-ink",
  CANCELLED: "bg-danger text-cream",
  REFUNDED: "bg-beige-dark text-muted",
  FAILED: "bg-danger text-cream",
};

export const LEGACY_ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pending: "PENDING_PAYMENT",
  confirmed: "PAID",
  processing: "PACKED",
  shipped: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
};

export function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
  if (!status) return "PENDING_PAYMENT";
  if ((ORDER_STATUSES as readonly string[]).includes(status)) return status as OrderStatus;
  return LEGACY_ORDER_STATUS_MAP[status] ?? "PENDING_PAYMENT";
}

export function orderStatusLabel(status: string | null | undefined): string {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(status)];
}
