import { getAdminCoupons } from "../actions";
import { formatPrice } from "@/lib/utils";
import { Ticket } from "lucide-react";
import CouponActions from "./CouponActions";
import NewCouponForm from "./NewCouponForm";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  const coupons = await getAdminCoupons();

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> COUPONS
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Promo codes.</h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">{String(coupons.length).padStart(2, "0")} total</p>
        </div>
      </div>

      <NewCouponForm />

      {coupons.length === 0 ? (
        <div className="border border-ink/15 flex flex-col items-center gap-3 py-20 text-muted mt-6">
          <Ticket size={28} strokeWidth={1.25} />
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase">/ No coupons yet.</p>
        </div>
      ) : (
        <div className="border border-ink/15 overflow-hidden mt-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/15 text-left bg-beige-dark">
                {["Code", "Type", "Value", "Min order", "Uses", "Status", "Expires", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: any, i: number) => {
                const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                const active = coupon.is_active && !expired;
                return (
                  <tr
                    key={coupon.id}
                    className={`hover:bg-beige-dark transition-colors ${
                      i < coupons.length - 1 ? "border-b border-ink/10" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-sm tracking-[0.06em] text-ink">{coupon.code}</td>
                    <td className="px-5 py-3.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">{coupon.discount_type}</td>
                    <td className="px-5 py-3.5 font-mono text-sm tabular-nums text-ink">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-muted">
                      {coupon.minimum_order > 0 ? formatPrice(coupon.minimum_order) : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-muted">
                      {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${
                          active ? "bg-citrine text-ink" : "bg-beige-dark text-muted"
                        }`}
                      >
                        {!coupon.is_active ? "Inactive" : expired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString("en-KE", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "Never"}
                    </td>
                    <td className="px-5 py-3.5">
                      <CouponActions couponId={coupon.id} isActive={coupon.is_active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
