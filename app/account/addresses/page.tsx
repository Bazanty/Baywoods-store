"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { KENYA_COUNTIES } from "@/lib/kenya";

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address: string;       // maps to line1
  city: string;
  county: string;        // maps to state
  postal: string;        // maps to postal_code
  phone: string;
  is_default: boolean;
}

const EMPTY_FORM = {
  label: "Home",
  first_name: "",
  last_name: "",
  address: "",
  city: "",
  county: "Nairobi",
  postal: "",
  phone: "",
};

function mapRow(row: Record<string, unknown>): Address {
  const postal = (row.postal_code as string) ?? "";
  return {
    id:         row.id as string,
    label:      (row.label as string) ?? "Home",
    first_name: (row.first_name as string) ?? (row.full_name as string ?? "").split(" ")[0],
    last_name:  (row.last_name as string) ?? (row.full_name as string ?? "").split(" ").slice(1).join(" "),
    address:    (row.address as string) ?? (row.line1 as string) ?? "",
    city:       row.city as string,
    county:     (row.county as string) ?? (row.state as string) ?? "",
    // Old rows defaulted to "00100" via the previous hardcode; drop that
    // sentinel so the input renders empty instead of forcing Nairobi CBD on
    // people who actually live elsewhere.
    postal:     postal === "00100" ? "" : postal,
    phone:      (row.phone as string) ?? "",
    is_default: row.is_default as boolean,
  };
}

export default function AddressesPage() {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      try {
        const { data } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });
        setAddresses((data ?? []).map(mapRow));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [user]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      label: addr.label,
      first_name: addr.first_name,
      last_name: addr.last_name,
      address: addr.address,
      city: addr.city,
      county: addr.county,
      postal: addr.postal,
      phone: addr.phone,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    const payload = {
      label:      form.label,
      first_name: form.first_name,
      last_name:  form.last_name,
      full_name:  `${form.first_name} ${form.last_name}`.trim(),
      address:    form.address,
      line1:      form.address,
      city:       form.city,
      county:     form.county,
      state:      form.county,
      phone:      form.phone,
      postal_code:   form.postal.trim() || null,
      country_code:  "KE",
      updated_at: new Date().toISOString(),
    };

    try {
      if (editing) {
      const { data, error: updateError } = await supabase.from("addresses").update(payload).eq("id", editing.id).select().single();
      if (updateError) throw updateError;
      if (data) setAddresses((prev) => prev.map((a) => (a.id === editing.id ? mapRow(data) : a)));
    } else {
      const { data, error: insertError } = await supabase.from("addresses").insert({ ...payload, user_id: user.id, is_default: addresses.length === 0 }).select().single();
      if (insertError) throw insertError;
      if (data) setAddresses((prev) => [...prev, mapRow(data)]);
    }

      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    const { error: deleteError } = await supabase.from("addresses").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (prev.find((a) => a.id === id)?.is_default && next[0]) {
        setDefault(next[0].id);
      }
      return next;
    });
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  };

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <Link href="/account" className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1 mb-2">
          <ChevronLeft size={12} /> Account
        </Link>
        <div className="border-b border-ink/15 pb-6 mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="section-kicker mb-4">ADDRESSES</p>
            <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl">Where to.</h1>
          </div>
          <button onClick={openAdd} className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine inline-flex items-center gap-2">
            <Plus size={12} /> Add new →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-beige-dark animate-pulse" />)}</div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-20 border border-ink/15">
            <MapPin size={36} className="text-muted mx-auto mb-4" strokeWidth={1.25} />
            <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">No saved addresses.</p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-5">/ Add one for faster checkout</p>
            <button onClick={openAdd} className="btn-primary">Add address</button>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {addresses.map((addr, i) => (
              <div key={addr.id} className="border border-ink/20 bg-cream p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted">/{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">{addr.label}</span>
                        {addr.is_default && <span className="font-mono text-[9px] tracking-[0.18em] uppercase bg-ink text-citrine px-1.5 py-0.5">Default</span>}
                      </div>
                      <p className="font-display text-base tracking-[-0.01em] text-ink">{addr.first_name} {addr.last_name}</p>
                      <p className="text-sm text-muted">{addr.address}</p>
                      <p className="text-sm text-muted">{addr.city}, {addr.county}</p>
                      {addr.phone && <p className="font-mono text-xs tabular-nums text-muted mt-1">{addr.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(addr)} className="p-2 text-muted hover:text-ink transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 text-muted hover:text-danger transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
                {!addr.is_default && (
                  <button onClick={() => setDefault(addr.id)} className="mt-3 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine underline-citrine">
                    Set as default →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="border border-ink/20 bg-cream p-6"
            >
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ {editing ? "Edit" : "New"}</p>
              <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-5">{editing ? "Edit address." : "New address."}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                {error && (
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
                    / {error}
                  </p>
                )}
                <div>
                  <label className="label-base">Label</label>
                  <select value={form.label} onChange={set("label")} className="input-base">
                    {["Home","Work","Other"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" required value={form.first_name} onChange={set("first_name")} placeholder="Brian" />
                  <Input label="Last Name" required value={form.last_name} onChange={set("last_name")} placeholder="Nyakundi" />
                </div>
                <Input label="Street Address" required value={form.address} onChange={set("address")} placeholder="123 Kimathi Street" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" required value={form.city} onChange={set("city")} placeholder="Nairobi" />
                  <div>
                    <label className="label-base">County</label>
                    <select value={form.county} onChange={set("county")} className="input-base">
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} placeholder="0712 345 678" />
                  <Input label="Postal Code (optional)" value={form.postal} onChange={set("postal")} placeholder="00100" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-1/3">Cancel</Button>
                  <Button type="submit" loading={saving} className="flex-1">{editing ? "Save Changes" : "Add Address"}</Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
