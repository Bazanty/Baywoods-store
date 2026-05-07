import { getReturnRequests } from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";
import ReturnActions from "./ReturnActions";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  requested: "bg-amber-100 text-amber-900",
  approved:  "bg-sky-100 text-sky-900",
  denied:    "bg-rose-100 text-rose-900",
  received:  "bg-indigo-100 text-indigo-900",
  refunded:  "bg-emerald-100 text-emerald-900",
};

export default async function ReturnsPage() {
  const requests = await getReturnRequests();
  const pending = requests.filter((r) => r.status === "requested").length;

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Return requests</h1>
          <p className="text-sm text-muted mt-1">
            {pending} awaiting review · {requests.length} total
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="border border-stone bg-white p-5 grid md:grid-cols-[2fr_1fr_auto] gap-5 items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs text-muted">#{r.orderId.slice(0, 8)}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${statusTone[r.status] ?? "bg-stone"}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-ink font-medium">{r.customerName}</p>
              <p className="text-xs text-muted">{r.email}</p>
              <p className="text-sm text-ink/70 mt-3 whitespace-pre-line">{r.reason}</p>
              {r.adminNote && (
                <p className="text-xs text-muted mt-2 italic">Note: {r.adminNote}</p>
              )}
            </div>
            <div className="text-right md:text-right">
              <p className="text-xs text-muted">Order total</p>
              <p className="font-serif text-lg text-ink">{formatPrice(r.orderTotal)}</p>
              <p className="text-xs text-muted mt-2">
                {new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
              </p>
            </div>
            <ReturnActions id={r.id} status={r.status} />
          </div>
        ))}

        {requests.length === 0 && (
          <div className="border border-stone bg-white py-14 text-center text-sm text-muted">
            No return requests yet.
          </div>
        )}
      </div>
    </div>
  );
}
