import { Tag } from "lucide-react";
import { getAdminCategories } from "../actions";
import NewCategoryForm from "./NewCategoryForm";
import DeleteCategoryButton from "./DeleteCategoryButton";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await getAdminCategories();

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="border-b border-ink/15 pb-6 mb-8 max-w-5xl">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> CATEGORIES
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Categories &amp; brands.</h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">{String(categories.length).padStart(2, "0")} total</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-5xl lg:grid-cols-[1fr_320px]">
        {/* List */}
        <div className="border border-ink/15 overflow-hidden">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted">
              <Tag size={28} strokeWidth={1.25} />
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase">/ No categories yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink/15 text-left bg-beige-dark">
                  <th className="px-5 py-3.5 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">Name</th>
                  <th className="px-4 py-3.5 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">Slug</th>
                  <th className="px-4 py-3.5 font-mono text-[10px] tracking-[0.18em] uppercase text-muted text-right">Products</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-beige-dark transition-colors ${
                      i < categories.length - 1 ? "border-b border-ink/10" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-display text-base tracking-[-0.01em] text-ink">{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-mono text-sm tabular-nums ${c.productCount === 0 ? "text-muted" : "text-ink"}`}>
                        {c.productCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <DeleteCategoryButton categoryId={c.id} name={c.name} productCount={c.productCount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create form */}
        <aside className="border border-ink/15 p-5 h-fit">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4 pb-3 border-b border-ink/15">
            / Add category
          </p>
          <NewCategoryForm />
          <p className="mt-4 font-mono text-[10px] tracking-[0.14em] uppercase text-muted leading-relaxed">
            / New categories can also be brands &mdash; e.g. Puma, Converse. They appear when creating products.
          </p>
        </aside>
      </div>
    </div>
  );
}
