import { getAdminInventory } from "@/app/admin/actions";
import RestockRow from "./RestockRow";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await getAdminInventory();
  const lowStock = rows.filter((r) => r.available <= 5).length;
  const outOfStock = rows.filter((r) => r.available <= 0).length;

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Inventory</h1>
          <p className="text-sm text-muted mt-1">
            {rows.length} SKUs · {lowStock} low · {outOfStock} out of stock
          </p>
        </div>
      </div>

      <div className="border border-stone bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-stone">
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
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
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">
                  No inventory records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
