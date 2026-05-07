import { getAdminCustomers } from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Customers</h1>
          <p className="text-sm text-muted mt-1">
            {customers.length} unique customer{customers.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="border border-stone bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-stone">
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-right">Orders</th>
              <th className="px-5 py-3 text-right">Total spent</th>
              <th className="px-5 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email || c.userId} className="border-b border-stone/60 hover:bg-cream/40">
                <td className="px-5 py-3 text-ink">{c.name || "—"}</td>
                <td className="px-5 py-3 text-muted">{c.email || "guest"}</td>
                <td className="px-5 py-3 text-right tabular-nums">{c.orderCount}</td>
                <td className="px-5 py-3 text-right tabular-nums text-ink font-medium">
                  {formatPrice(c.totalSpent)}
                </td>
                <td className="px-5 py-3 text-muted text-xs">
                  {new Date(c.lastOrderAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
