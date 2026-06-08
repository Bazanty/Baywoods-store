import { getAdminInventory } from "@/app/admin/actions";
import RestockRow from "./RestockRow";
import ExportButton from "../_components/ExportButton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await getAdminInventory();
  const lowStock = rows.filter((r) => r.available <= 5).length;
  const outOfStock = rows.filter((r) => r.available <= 0).length;

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="border-b border-ink/15 pb-6 mb-8 max-w-6xl">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> INVENTORY
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Stock levels.</h1>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
              <span className="text-ink">{rows.length} SKUs</span>
              <span className="text-muted"> · {lowStock} low · {outOfStock} out</span>
            </p>
            <ExportButton type="inventory" label="Export CSV" />
          </div>
        </div>
      </div>

      <div className="border border-ink/15 overflow-x-auto max-w-6xl">
        <table className="w-full">
          <thead className="border-b border-ink/15 bg-beige-dark">
            <tr className="text-left font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3 text-right">Stock</th>
              <th className="px-5 py-3 text-right">Reserved</th>
              <th className="px-5 py-3 text-right">Available</th>
              <th className="px-5 py-3 text-right">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <RestockRow key={r.id} row={r} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
                  / No inventory records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
