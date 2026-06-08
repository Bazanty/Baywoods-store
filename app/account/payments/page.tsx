"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CreditCard,
  Smartphone,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import { formatPrice } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface MpesaNumber {
  phone: string;
  label: string;
}

interface PaymentRecord {
  id: string;
  method: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  mpesa_receipt: string | null;
  order_id: string;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "text-ink bg-citrine",
  pending: "text-ink border border-ink/30",
  failed: "text-cream bg-danger",
  refunded: "text-muted bg-beige-dark",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentMethodsPage() {
  const { user } = useAuthStore();
  const meta = user?.user_metadata ?? {};

  const [mpesaNumbers, setMpesaNumbers] = useState<MpesaNumber[]>(
    meta.mpesa_numbers ?? []
  );
  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [formPhone, setFormPhone] = useState("");
  const [formLabel, setFormLabel] = useState("Personal");
  const [saving, setSaving] = useState(false);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("payments")
          .select("id, method, amount, status, paid_at, created_at, mpesa_receipt, order_id")
          .eq("order_id", supabase.from("orders").select("id").eq("user_id", user.id))
          .order("created_at", { ascending: false })
          .limit(10);

        if (!data || data.length === 0) {
          const { data: orders } = await supabase
            .from("orders")
            .select("id")
            .eq("user_id", user.id);
          if (orders && orders.length > 0) {
            const orderIds = orders.map((o) => o.id);
            const { data: paymentData } = await supabase
              .from("payments")
              .select("id, method, amount, status, paid_at, created_at, mpesa_receipt, order_id")
              .in("order_id", orderIds)
              .order("created_at", { ascending: false })
              .limit(10);
            setPayments(paymentData ?? []);
          }
        } else {
          setPayments(data);
        }
      } catch {
        // ignore
      } finally {
        setPaymentsLoading(false);
      }
    })();
  }, [user]);

  const persistNumbers = async (updated: MpesaNumber[]) => {
    setSaving(true);
    await supabase.auth.updateUser({
      data: { mpesa_numbers: updated },
    });
    setMpesaNumbers(updated);
    setSaving(false);
  };

  const openAdd = () => {
    setEditingIdx(null);
    setFormPhone("");
    setFormLabel("Personal");
    setShowForm(true);
  };

  const openEdit = (idx: number) => {
    setEditingIdx(idx);
    setFormPhone(mpesaNumbers[idx].phone);
    setFormLabel(mpesaNumbers[idx].label);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const entry: MpesaNumber = { phone: formPhone.trim(), label: formLabel };
    let updated: MpesaNumber[];
    if (editingIdx !== null) {
      updated = mpesaNumbers.map((n, i) => (i === editingIdx ? entry : n));
    } else {
      updated = [...mpesaNumbers, entry];
    }
    await persistNumbers(updated);
    setShowForm(false);
  };

  const handleDelete = async (idx: number) => {
    await persistNumbers(mpesaNumbers.filter((_, i) => i !== idx));
  };

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <Link href="/account" className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1 mb-2">
          <ChevronLeft size={12} /> Account
        </Link>
        <div className="border-b border-ink/15 pb-6 mb-10">
          <p className="section-kicker mb-4">PAYMENT</p>
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl">Methods.</h1>
        </div>

        {/* M-Pesa Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-ink flex items-center justify-center">
                <Smartphone size={15} className="text-citrine" />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ 01</p>
                <h2 className="font-display text-lg tracking-[-0.01em] text-ink">M-Pesa numbers</h2>
              </div>
            </div>
            {mpesaNumbers.length < 3 && !showForm && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine transition-colors"
              >
                <Plus size={12} /> Add →
              </button>
            )}
          </div>

          {mpesaNumbers.length === 0 && !showForm ? (
            <div className="border border-dashed border-ink/25 py-10 text-center">
              <Smartphone size={28} className="text-muted mx-auto mb-3" strokeWidth={1.25} />
              <p className="font-display text-lg tracking-[-0.01em] text-ink mb-1">No saved numbers.</p>
              <button onClick={openAdd} className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine underline-citrine">
                Add your M-Pesa number →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {mpesaNumbers.map((num, idx) => (
                <div
                  key={idx}
                  className="border border-ink/20 px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-ink flex items-center justify-center">
                      <Smartphone size={13} className="text-citrine" />
                    </div>
                    <div>
                      <p className="font-mono text-sm tabular-nums text-ink">{num.phone}</p>
                      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-0.5">{num.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(idx)}
                      className="p-2 text-muted hover:text-ink transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-2 text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleSave}
                  className="border border-ink/20 bg-cream p-5 mt-3 space-y-4"
                >
                  <p className="font-display text-lg tracking-[-0.01em] text-ink">
                    {editingIdx !== null ? "Edit number." : "Add M-Pesa number."}
                  </p>
                  <Input
                    label="Phone Number"
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0712 345 678"
                  />
                  <div>
                    <label className="label-base">Label</label>
                    <select
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      className="input-base"
                    >
                      {["Personal", "Business", "Family"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" loading={saving}>
                      {editingIdx !== null ? "Save" : "Add Number"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        {/* Payment History */}
        <section>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 03</p>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-5">Recent payments.</h2>
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-beige-dark animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted text-center py-10 border border-dashed border-ink/25">
              / No payment history yet.{" "}
              <Link href="/shop" className="text-ink underline-citrine">
                Start shopping →
              </Link>
            </p>
          ) : (
            <div className="border border-ink/15 divide-y divide-ink/10">
              {payments.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/order/${p.order_id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-beige-dark transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted">/{String(i + 1).padStart(2, "0")}</span>
                    {p.method === "mpesa" ? (
                      <Smartphone size={14} className="text-ink" />
                    ) : (
                      <CreditCard size={14} className="text-ink" />
                    )}
                    <div>
                      <p className="font-mono text-sm tracking-[0.06em] text-ink">
                        {p.method === "mpesa" ? "M-PESA" : "CARD"}{" "}
                        <span className="text-muted">
                          {p.mpesa_receipt ? `· ${p.mpesa_receipt}` : ""}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                        {formatDate(p.paid_at ?? p.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="price text-sm font-medium text-ink">
                      {formatPrice(p.amount)}
                    </p>
                    <span
                      className={`inline-block font-mono text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 mt-1 ${
                        STATUS_STYLE[p.status] ?? STATUS_STYLE.pending
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
