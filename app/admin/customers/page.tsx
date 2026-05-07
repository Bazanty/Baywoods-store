import { getAdminCustomers } from "@/app/admin/actions";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="px-8 py-10 max-w-5xl">
      <div className="mb-7">
        <h1 className="font-serif text-2xl text-ink">Customers</h1>
        <p className="text-sm text-muted mt-0.5">
          {customers.length} unique customer{customers.length === 1 ? "" : "s"}
        </p>
      </div>
      <CustomersClient customers={customers} />
    </div>
  );
}
