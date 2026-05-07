"use client";

import { useTransition } from "react";
import { toggleCouponActive, deleteCoupon } from "../actions";

interface Props {
  couponId: string;
  isActive: boolean;
}

export default function CouponActions({ couponId, isActive }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => toggleCouponActive(couponId, !isActive))}
        className="text-[11px] text-muted hover:text-ink transition-colors disabled:opacity-50"
      >
        {isActive ? "Disable" : "Enable"}
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Delete this coupon?")) {
            startTransition(() => deleteCoupon(couponId));
          }
        }}
        className="text-[11px] text-muted hover:text-danger transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
