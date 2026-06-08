import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="mb-8 border-b border-ink/15 pb-6 max-w-5xl">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> PRODUCTS &nbsp;→ &nbsp;NEW
        </p>
        <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">New product.</h1>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-3">/ Fill in the details below.</p>
      </div>
      <ProductForm />
    </div>
  );
}
