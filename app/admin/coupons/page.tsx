import { getAdminCoupons } from "../actions";
import { formatPrice } from "@/lib/utils";
import { Ticket } from "lucide-react";
import CouponActions from "./CouponActions";
import NewCouponForm from "./NewCouponForm";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  const coupons = await getAdminCoupons();

  return (
    <div className="px-8 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-serif text-2xl text-ink">Coupons</h1>
          <p className="text-sm text-muted mt-0.5">{coupons.length} total</p>
        </div>
      </div>

      <NewCouponForm />

      {coupons.length === 0 ? (
        <div className="bg-white rounded flex flex-col items-center gap-3 py-20 text-muted mt-6">
          <Ticket size={32} strokeWidth={1} />
          <p className="text-sm">No coupons yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded overflow-hidden mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left">
                {["Code", "Type", "Value", "Min Order", "Uses", "Status", "Expires", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-muted tracking-wider uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: any, i: number) => {
                const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                return (
                  <tr
                    key={coupon.id}
                    className={`hover:bg-stone/20 transition-colors ${
                      i < coupons.length - 1 ? "border-b border-stone/50" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono font-semibold text-ink">{coupon.code}</td>
                    <td className="px-5 py-3.5 text-muted capitalize">{coupon.discount_type}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {coupon.minimum_order > 0 ? formatPrice(coupon.minimum_order) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-sm font-medium ${
                          !coupon.is_active || expired
                            ? "bg-stone-light text-muted"
                            : "bg-forest/10 text-forest"
                        }`}
                      >
                        {!coupon.is_active ? "Inactive" : expired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric",
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
