import { getAdminCustomers } from "@/app/admin/actions";
import CustomersClient from "./CustomersClient";
import ExportButton from "../_components/ExportButton";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> CUSTOMERS
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">All customers.</h1>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">
              {String(customers.length).padStart(3, "0")} unique
            </p>
            <ExportButton type="customers" label="Export CSV" />
          </div>
        </div>
      </div>
      <CustomersClient customers={customers} />
    </div>
  );
}
