"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address: string;       // maps to line1
  city: string;
  county: string;        // maps to state
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
  phone: "",
};

function mapRow(row: Record<string, unknown>): Address {
  return {
    id:         row.id as string,
    label:      (row.label as string) ?? "Home",
    first_name: (row.first_name as string) ?? (row.full_name as string ?? "").split(" ")[0],
    last_name:  (row.last_name as string) ?? (row.full_name as string ?? "").split(" ").slice(1).join(" "),
    address:    (row.address as string) ?? (row.line1 as string) ?? "",
    city:       row.city as string,
    county:     (row.county as string) ?? (row.state as string) ?? "",
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
    setForm({ label: addr.label, first_name: addr.first_name, last_name: addr.last_name, address: addr.address, city: addr.city, county: addr.county, phone: addr.phone });
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
      postal_code:   "00100",
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
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/account" className="text-muted hover:text-ink transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <h1 className="font-serif text-3xl text-ink">Addresses</h1>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 text-sm text-forest hover:text-forest-dark transition-colors">
            <Plus size={15} /> Add New
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-stone/40 animate-pulse" />)}</div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-20">
            <MapPin size={40} className="text-stone mx-auto mb-4" strokeWidth={1} />
            <p className="text-ink font-medium mb-2">No saved addresses</p>
            <p className="text-sm text-muted mb-5">Add a delivery address for faster checkout.</p>
            <button onClick={openAdd} className="btn-primary">Add Address</button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-cream border border-stone p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold tracking-wide uppercase text-muted">{addr.label}</span>
                      {addr.is_default && <span className="text-[10px] font-semibold bg-forest text-white px-1.5 py-0.5">Default</span>}
                    </div>
                    <p className="text-sm font-medium text-ink">{addr.first_name} {addr.last_name}</p>
                    <p className="text-sm text-muted">{addr.address}</p>
                    <p className="text-sm text-muted">{addr.city}, {addr.county}</p>
                    {addr.phone && <p className="text-sm text-muted">{addr.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(addr)} className="p-2 text-muted hover:text-ink transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 text-muted hover:text-danger transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                {!addr.is_default && (
                  <button onClick={() => setDefault(addr.id)} className="mt-3 text-xs text-forest underline underline-offset-2">Set as default</button>
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
              className="border border-stone bg-cream p-6"
            >
              <h2 className="font-serif text-xl text-ink mb-5">{editing ? "Edit Address" : "New Address"}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                {error && (
                  <p className="text-xs text-danger bg-red-50 border border-red-100 px-3 py-2">
                    {error}
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
                      {["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Other"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} placeholder="0712 345 678" />
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
