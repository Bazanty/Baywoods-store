import { requireAdmin } from "@/lib/adminAuth";
import { getMpesaDiagnostics } from "@/lib/mpesaDiagnostics";
import { SAFARICOM_CALLBACK_IP_LIST } from "@/lib/security";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import PaymentReconciliationClient from "./PaymentReconciliationClient";

export const dynamic = "force-dynamic";

async function getMpesaPayments() {
  await requireAdmin();

  const { data, error } = await createSupabaseAdminClient()
    .from("payments")
    .select(`
      id, order_id, method, status, amount, currency,
      checkout_request_id, merchant_request_id, mpesa_receipt, mpesa_phone,
      mpesa_amount, result_desc, failure_code, callback_received_at,
      created_at, updated_at, raw_callback,
      orders (
        id, status, payment_status, total, shipping_name, email,
        shipping_phone, created_at
      )
    `)
    .eq("method", "mpesa")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin payments] load failed:", error);
    return [];
  }

  return (data ?? []).map((payment: any) => ({
    ...payment,
    hasRawCallback: !!payment.raw_callback,
    raw_callback: undefined,
  }));
}

export default async function AdminPaymentsPage() {
  const [payments, diagnostics] = await Promise.all([
    getMpesaPayments(),
    Promise.resolve(getMpesaDiagnostics()),
  ]);

  return (
    <div className="px-6 lg:px-10 py-10 max-w-6xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> M-PESA
        </p>
        <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Payments.</h1>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-3">
          / Callback diagnostics and payment reconciliation
        </p>
      </div>

      <PaymentReconciliationClient
        payments={payments as any}
        diagnostics={diagnostics}
        safaricomIpCount={SAFARICOM_CALLBACK_IP_LIST.length}
      />
    </div>
  );
}
