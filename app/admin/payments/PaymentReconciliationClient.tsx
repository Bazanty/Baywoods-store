"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import type { MpesaDiagnostics } from "@/lib/mpesaDiagnostics";
import { ORDER_STATUS_STYLES, normalizeOrderStatus, orderStatusLabel } from "@/lib/orderStatus";
import { formatPrice } from "@/lib/utils";
import {
  confirmMpesaPaymentManually,
  queryMpesaPayment,
  repairPaidOrderStatus,
  replaySavedMpesaCallback,
} from "./actions";

interface Payment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  mpesa_receipt: string | null;
  mpesa_phone: string | null;
  mpesa_amount: number | null;
  result_desc: string | null;
  failure_code: string | null;
  callback_received_at: string | null;
  created_at: string;
  updated_at: string;
  hasRawCallback: boolean;
  orders: {
    id: string;
    status: string;
    payment_status: string;
    total: number;
    shipping_name: string;
    email: string;
    shipping_phone: string | null;
    created_at: string;
  } | null;
}

interface Props {
  payments: Payment[];
  diagnostics: MpesaDiagnostics;
  safaricomIpCount: number;
}

type Filter = "all" | "needs_action" | "pending" | "failed" | "paid";

function minutesSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
}

function paymentIssue(payment: Payment): string | null {
  const order = payment.orders;
  if (payment.status === "paid" && order?.payment_status !== "paid") {
    return "Paid payment, order not marked paid";
  }
  if (payment.status === "pending" && minutesSince(payment.created_at) >= 15) {
    return "Callback delayed or payment stuck pending";
  }
  if (payment.callback_received_at && payment.status === "pending") {
    return "Callback saved, payment not finalized";
  }
  return null;
}

function paymentStatusClass(status: string) {
  if (status === "paid") return "bg-forest/10 text-forest";
  if (status === "failed") return "bg-danger/10 text-danger";
  if (status === "refunded") return "bg-stone-light text-muted";
  return "bg-citrine/30 text-ink";
}

export default function PaymentReconciliationClient({
  payments,
  diagnostics,
  safaricomIpCount,
}: Props) {
  const [filter, setFilter] = useState<Filter>("needs_action");
  const [messages, setMessages] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [pending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const issues = payments.filter((payment) => paymentIssue(payment)).length;
    const stuck = payments.filter(
      (payment) => payment.status === "pending" && minutesSince(payment.created_at) >= 15
    ).length;
    return {
      total: payments.length,
      issues,
      pending: payments.filter((payment) => payment.status === "pending").length,
      failed: payments.filter((payment) => payment.status === "failed").length,
      paid: payments.filter((payment) => payment.status === "paid").length,
      stuck,
    };
  }, [payments]);

  const visible = useMemo(() => {
    if (filter === "all") return payments;
    if (filter === "needs_action") return payments.filter((payment) => paymentIssue(payment));
    return payments.filter((payment) => payment.status === filter);
  }, [filter, payments]);

  const runAction = (
    paymentId: string,
    action: () => Promise<{ ok: boolean; message: string }>
  ) => {
    startTransition(async () => {
      try {
        const result = await action();
        setMessages((prev) => ({ ...prev, [paymentId]: result }));
      } catch (err) {
        setMessages((prev) => ({
          ...prev,
          [paymentId]: {
            ok: false,
            message: err instanceof Error ? err.message : "Action failed.",
          },
        }));
      }
    });
  };

  const submitManualConfirm = (payment: Payment, form: HTMLFormElement) => {
    const formData = new FormData(form);
    runAction(payment.id, () => confirmMpesaPaymentManually(payment.id, formData));
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="bg-cream border border-ink/10 p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Callback URL</p>
          <p className="text-sm font-medium text-ink break-all">
            {diagnostics.callbackUrl ?? "Not configured"}
          </p>
          <StatusLine ok={diagnostics.callbackUrlOk} text={diagnostics.callbackUrlOk ? "Looks valid" : diagnostics.callbackUrlIssues.join(" ")} />
        </div>
        <div className="bg-cream border border-ink/10 p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Daraja Mode</p>
          <p className="text-sm font-medium text-ink">
            {diagnostics.environment} {diagnostics.mockMode ? "/ mock" : ""}
          </p>
          <StatusLine
            ok={diagnostics.productionReady}
            text={diagnostics.productionReady ? "Production-ready settings" : "Review before production"}
          />
        </div>
        <div className="bg-cream border border-ink/10 p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Callback IP Check</p>
          <p className="text-sm font-medium text-ink">
            {diagnostics.skipIpCheck ? "Skipped" : "Enforced"} / {safaricomIpCount} known IPs
          </p>
          <StatusLine
            ok={!diagnostics.skipIpCheck}
            text={diagnostics.skipIpCheck ? "Only use this for local testing" : "Safaricom IP allowlist active"}
          />
        </div>
      </section>

      {(diagnostics.warnings.length > 0 || diagnostics.callbackUrlIssues.length > 0) && (
        <div className="bg-danger/5 border border-danger/30 text-danger p-4 text-sm">
          {[...diagnostics.callbackUrlIssues, ...diagnostics.warnings].map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-5">
        {[
          ["Needs action", stats.issues],
          ["Pending", stats.pending],
          ["Stuck 15m+", stats.stuck],
          ["Paid", stats.paid],
          ["Failed", stats.failed],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream border border-ink/10 p-4">
            <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
            <p className="font-serif text-2xl text-ink mt-1">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {(["needs_action", "pending", "failed", "paid", "all"] as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1.5 border transition-colors ${
              filter === key
                ? "bg-ink text-cream border-ink"
                : "bg-cream border-stone text-muted hover:text-ink hover:border-ink"
            }`}
          >
            {key.replace("_", " ")}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="border border-ink/15 py-12 text-center text-sm text-muted">
          No payments match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((payment) => {
            const issue = paymentIssue(payment);
            const orderStatus = normalizeOrderStatus(payment.orders?.status);
            const message = messages[payment.id];
            return (
              <div key={payment.id} className="bg-cream border border-ink/15 overflow-hidden">
                <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-muted">
                        {payment.orders?.id?.slice(0, 8).toUpperCase() ?? payment.order_id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 font-medium ${paymentStatusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 font-medium ${ORDER_STATUS_STYLES[orderStatus]}`}>
                        {orderStatusLabel(orderStatus)}
                      </span>
                      {issue && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-danger/10 text-danger">
                          <AlertTriangle size={11} /> {issue}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-ink">
                      {payment.orders?.shipping_name ?? "Unknown customer"}
                    </p>
                    <p className="text-xs text-muted">
                      {payment.orders?.email ?? "No email"} / {payment.mpesa_phone ?? payment.orders?.shipping_phone ?? "No phone"}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Checkout: <span className="font-mono">{payment.checkout_request_id ?? "missing"}</span>
                    </p>
                    <p className="text-xs text-muted">
                      Merchant: <span className="font-mono">{payment.merchant_request_id ?? "missing"}</span>
                    </p>
                    {payment.result_desc && (
                      <p className="text-xs text-muted mt-1">{payment.result_desc}</p>
                    )}
                  </div>

                  <div className="lg:text-right shrink-0">
                    <p className="font-medium text-ink">
                      {formatPrice(Number(payment.mpesa_amount ?? payment.amount))}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(payment.created_at).toLocaleString("en-KE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {payment.mpesa_receipt && (
                      <p className="text-xs font-mono text-forest mt-1">{payment.mpesa_receipt}</p>
                    )}
                    <p className="text-[11px] text-muted mt-1">
                      Callback: {payment.callback_received_at ? "received" : "not received"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone/50 px-5 py-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending || !payment.checkout_request_id || payment.status !== "pending"}
                      onClick={() => runAction(payment.id, () => queryMpesaPayment(payment.id))}
                      className="inline-flex items-center gap-1.5 text-xs border border-stone px-3 py-1.5 text-ink hover:border-ink disabled:opacity-40"
                    >
                      <RefreshCw size={12} /> Query Safaricom
                    </button>
                    <button
                      type="button"
                      disabled={pending || !payment.hasRawCallback}
                      onClick={() => runAction(payment.id, () => replaySavedMpesaCallback(payment.id))}
                      className="inline-flex items-center gap-1.5 text-xs border border-stone px-3 py-1.5 text-ink hover:border-ink disabled:opacity-40"
                    >
                      <Clock size={12} /> Replay saved callback
                    </button>
                    <button
                      type="button"
                      disabled={pending || payment.status !== "paid" || payment.orders?.payment_status === "paid"}
                      onClick={() => runAction(payment.id, () => repairPaidOrderStatus(payment.id))}
                      className="inline-flex items-center gap-1.5 text-xs border border-stone px-3 py-1.5 text-ink hover:border-ink disabled:opacity-40"
                    >
                      <ShieldCheck size={12} /> Repair paid order
                    </button>
                  </div>

                  {payment.status === "pending" && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitManualConfirm(payment, event.currentTarget);
                      }}
                      className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1.5fr_auto]"
                    >
                      <input
                        name="receipt"
                        placeholder="Verified receipt"
                        className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink"
                      />
                      <input
                        name="amount"
                        placeholder="Amount"
                        defaultValue={Number(payment.mpesa_amount ?? payment.amount)}
                        className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink"
                      />
                      <input
                        name="phone"
                        placeholder="Phone"
                        defaultValue={payment.mpesa_phone ?? ""}
                        className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink"
                      />
                      <input
                        name="note"
                        placeholder="Admin note"
                        className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink"
                      />
                      <button
                        type="submit"
                        disabled={pending}
                        className="inline-flex items-center justify-center gap-1.5 text-xs bg-ink text-cream px-3 py-1.5 hover:bg-forest-dark disabled:opacity-40"
                      >
                        <CheckCircle2 size={12} /> Confirm paid
                      </button>
                    </form>
                  )}

                  {message && (
                    <p className={`text-xs ${message.ok ? "text-forest" : "text-danger"}`}>
                      {message.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`mt-2 text-xs ${ok ? "text-forest" : "text-danger"}`}>
      {text}
    </p>
  );
}
