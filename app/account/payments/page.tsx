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
  Check,
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
  completed: "text-forest bg-forest/5 border-forest/20",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  failed: "text-danger bg-red-50 border-red-100",
  refunded: "text-muted bg-stone/30 border-stone",
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
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/account" className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="font-serif text-3xl text-ink">Payment Methods</h1>
        </div>

        {/* M-Pesa Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-forest/10 flex items-center justify-center">
                <Smartphone size={16} className="text-forest" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">M-Pesa Numbers</h2>
                <p className="text-xs text-muted">Save numbers for faster checkout</p>
              </div>
            </div>
            {mpesaNumbers.length < 3 && !showForm && (
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 text-xs text-forest hover:text-forest-dark transition-colors"
              >
                <Plus size={13} /> Add
              </button>
            )}
          </div>

          {mpesaNumbers.length === 0 && !showForm ? (
            <div className="border border-dashed border-stone py-8 text-center">
              <Smartphone size={28} className="text-stone mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-muted mb-3">No saved M-Pesa numbers</p>
              <button onClick={openAdd} className="text-xs text-forest font-medium hover:text-forest-dark transition-colors">
                Add your M-Pesa number
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {mpesaNumbers.map((num, idx) => (
                <div
                  key={idx}
                  className="bg-cream border border-stone px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-forest/10 flex items-center justify-center">
                      <Smartphone size={14} className="text-forest" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{num.phone}</p>
                      <p className="text-xs text-muted">{num.label}</p>
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
                  className="border border-stone bg-cream p-5 mt-3 space-y-4"
                >
                  <p className="text-sm font-medium text-ink">
                    {editingIdx !== null ? "Edit Number" : "Add M-Pesa Number"}
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

        {/* Card Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-stone/40 flex items-center justify-center">
              <CreditCard size={16} className="text-muted" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Card Payments</h2>
              <p className="text-xs text-muted">Pay securely with Visa or Mastercard at checkout</p>
            </div>
          </div>
          <div className="border border-stone bg-cream/50 px-5 py-4 flex items-center gap-3">
            <Check size={14} className="text-forest shrink-0" />
            <p className="text-sm text-muted">
              Card payments are available at checkout via Stripe. No card details are stored on our servers.
            </p>
          </div>
        </section>

        {/* Payment History */}
        <section>
          <h2 className="text-sm font-semibold text-ink mb-4">Recent Payments</h2>
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-stone/30 animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted text-center py-10 border border-dashed border-stone">
              No payment history yet.{" "}
              <Link href="/shop" className="text-forest underline underline-offset-2">
                Start shopping
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <Link
                  key={p.id}
                  href={`/order/${p.order_id}`}
                  className="flex items-center justify-between bg-cream border border-stone px-5 py-4 hover:border-ink transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {p.method === "mpesa" ? (
                      <Smartphone size={15} className="text-forest" />
                    ) : (
                      <CreditCard size={15} className="text-muted" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {p.method === "mpesa" ? "M-Pesa" : "Card"}{" "}
                        <span className="text-muted font-normal">
                          {p.mpesa_receipt ? `· ${p.mpesa_receipt}` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-muted">
                        {formatDate(p.paid_at ?? p.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">
                      {formatPrice(p.amount)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 border ${
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
