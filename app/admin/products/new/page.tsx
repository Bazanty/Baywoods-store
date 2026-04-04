import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-ink">New Product</h1>
        <p className="text-sm text-muted mt-0.5">Fill in the details below to add a product to the store.</p>
      </div>
      <ProductForm />
    </div>
  );
}
