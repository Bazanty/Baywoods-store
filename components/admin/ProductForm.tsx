"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createProduct, updateProduct, type UploadedImage, type ColorOption, type ProductPayload } from "@/app/admin/actions";
import ImageUploader from "./ImageUploader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils";

const CATEGORIES = [
  "shoes", "hoodies", "jorts", "joggers",
  "sweatpants", "shirts", "caps", "belts", "accessories",
];

interface Props {
  productId?: string;
  initial?: Partial<FormState>;
}

interface FormState {
  name: string;
  description: string;
  shortDescription: string;
  categorySlug: string;
  basePrice: string;
  comparePrice: string;
  sku: string;
  isFeatured: boolean;
  isActive: boolean;
  images: UploadedImage[];
  sizes: string[];
  colors: ColorOption[];
  stockQuantity: string;
}

const defaultState: FormState = {
  name: "",
  description: "",
  shortDescription: "",
  categorySlug: "shirts",
  basePrice: "",
  comparePrice: "",
  sku: "",
  isFeatured: false,
  isActive: true,
  images: [],
  sizes: [],
  colors: [],
  stockQuantity: "0",
};

export default function ProductForm({ productId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({ ...defaultState, ...initial });
  const [sizeInput, setSizeInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#111111");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Sizes
  const addSize = () => {
    const s = sizeInput.trim().toUpperCase();
    if (!s || form.sizes.includes(s)) return;
    set("sizes", [...form.sizes, s]);
    setSizeInput("");
  };

  const removeSize = (s: string) => set("sizes", form.sizes.filter((x) => x !== s));

  // Colors
  const addColor = () => {
    const name = colorName.trim();
    if (!name || form.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    set("colors", [...form.colors, { name, hex: colorHex }]);
    setColorName("");
    setColorHex("#111111");
  };

  const removeColor = (name: string) => set("colors", form.colors.filter((c) => c.name !== name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const basePrice = parseFloat(form.basePrice);
    const comparePrice = form.comparePrice ? parseFloat(form.comparePrice) : undefined;

    if (!form.name || isNaN(basePrice) || basePrice <= 0) {
      setStatus({ type: "error", message: "Name and a valid price are required." });
      return;
    }
    if (comparePrice !== undefined && isNaN(comparePrice)) {
      setStatus({ type: "error", message: "Compare price must be a valid number." });
      return;
    }

    const payload: ProductPayload = {
      name: form.name,
      description: form.description,
      shortDescription: form.shortDescription,
      categorySlug: form.categorySlug,
      basePrice,
      comparePrice,
      sku: form.sku || undefined,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      images: form.images,
      sizes: form.sizes,
      colors: form.colors,
      stockQuantity: parseInt(form.stockQuantity) || 0,
    };

    startTransition(async () => {
      try {
        if (productId) {
          await updateProduct(productId, payload);
          setStatus({ type: "success", message: "Product updated." });
        } else {
          const { slug } = await createProduct(payload);
          setStatus({ type: "success", message: "Product created." });
          setTimeout(() => router.push("/admin/products"), 1000);
        }
      } catch (err: any) {
        setStatus({ type: "error", message: err.message ?? "Something went wrong." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Status */}
      {status && (
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-3 text-sm rounded",
            status.type === "success"
              ? "bg-forest/10 text-forest border border-forest/20"
              : "bg-danger/10 text-danger border border-danger/20"
          )}
        >
          {status.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          {status.message}
        </div>
      )}

      {/* Basic info */}
      <Section title="Basic Info">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Product Name"
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Heavyweight Pullover"
              required
            />
            {form.name && (
              <p className="mt-1 text-xs text-muted">
                Slug: <span className="font-mono">{slugify(form.name)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-muted mb-2">
              Category
            </label>
            <select
              value={form.categorySlug}
              onChange={(e) => set("categorySlug", e.target.value)}
              className="w-full bg-cream border border-stone text-ink text-sm px-4 py-3 outline-none focus:border-ink transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="SKU"
            id="sku"
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
            placeholder="BW-HD-001"
          />

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium tracking-widest uppercase text-muted mb-2">
              Short Description
            </label>
            <input
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One-line summary shown on product cards"
              maxLength={200}
              className="w-full bg-cream border border-stone text-ink text-sm px-4 py-3 outline-none focus:border-ink transition-colors placeholder:text-muted"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium tracking-widest uppercase text-muted mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Full product description..."
              className="w-full bg-cream border border-stone text-ink text-sm px-4 py-3 outline-none focus:border-ink transition-colors placeholder:text-muted resize-y"
            />
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input
            label="Base Price (KSh)"
            id="basePrice"
            type="number"
            min={0}
            step={50}
            value={form.basePrice}
            onChange={(e) => set("basePrice", e.target.value)}
            placeholder="3500"
            required
          />
          <Input
            label="Compare Price (KSh)"
            id="comparePrice"
            type="number"
            min={0}
            step={50}
            value={form.comparePrice}
            onChange={(e) => set("comparePrice", e.target.value)}
            placeholder="Optional — shows strikethrough"
          />
          <Input
            label="Stock Quantity"
            id="stockQuantity"
            type="number"
            min={0}
            value={form.stockQuantity}
            onChange={(e) => set("stockQuantity", e.target.value)}
            placeholder="0"
          />
        </div>
      </Section>

      {/* Images */}
      <Section title="Images">
        <ImageUploader value={form.images} onChange={(imgs) => set("images", imgs)} />
      </Section>

      {/* Variants */}
      <Section title="Variants">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Sizes */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-muted mb-2">
              Sizes
            </label>
            <div className="flex gap-2 mb-3">
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
                placeholder="e.g. M, XL, 42"
                className="flex-1 bg-cream border border-stone text-ink text-sm px-3 py-2.5 outline-none focus:border-ink transition-colors placeholder:text-muted"
              />
              <button
                type="button"
                onClick={addSize}
                className="px-3 py-2.5 border border-stone hover:border-ink transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.sizes.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 bg-stone-light text-ink text-xs px-2.5 py-1 rounded-sm"
                >
                  {s}
                  <button type="button" onClick={() => removeSize(s)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              {form.sizes.length === 0 && (
                <span className="text-xs text-muted/60 italic">No sizes added</span>
              )}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-muted mb-2">
              Colors
            </label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-black/15 flex-shrink-0 transition-colors"
                  style={{ backgroundColor: colorHex }}
                />
                <input
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                  placeholder="Color name"
                  className="w-full bg-cream border border-stone text-ink text-sm pl-9 pr-3 py-2.5 outline-none focus:border-ink transition-colors placeholder:text-muted"
                />
              </div>
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                title="Pick hex color"
                className="w-11 h-[42px] border border-stone cursor-pointer bg-cream p-0.5"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-2.5 border border-stone hover:border-ink transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.colors.map((c) => (
                <span
                  key={c.name}
                  className="flex items-center gap-1.5 bg-stone-light text-ink text-xs px-2.5 py-1 rounded-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                  <button type="button" onClick={() => removeColor(c.name)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              {form.colors.length === 0 && (
                <span className="text-xs text-muted/60 italic">No colors added</span>
              )}
            </div>
          </div>
        </div>

        {form.sizes.length > 0 && form.colors.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Will generate{" "}
            <strong>{form.sizes.length * form.colors.length}</strong> variants (
            {form.sizes.length} sizes × {form.colors.length} colors)
          </p>
        )}
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4 accent-forest"
            />
            <span className="text-sm text-ink">
              Active{" "}
              <span className="text-muted">— visible in the store</span>
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="w-4 h-4 accent-forest"
            />
            <span className="text-sm text-ink">
              Featured{" "}
              <span className="text-muted">— shows &ldquo;Hot&rdquo; badge, appears in trending</span>
            </span>
          </label>
        </div>
      </Section>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2 border-t border-stone">
        <Button type="submit" loading={isPending}>
          {isPending
            ? productId ? "Saving…" : "Creating…"
            : productId ? "Save Changes" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-widest uppercase text-muted mb-4 pb-2 border-b border-stone">
        {title}
      </h3>
      {children}
    </div>
  );
}
