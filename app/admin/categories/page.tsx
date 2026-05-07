import { Tag } from "lucide-react";
import { getAdminCategories } from "../actions";
import NewCategoryForm from "./NewCategoryForm";
import DeleteCategoryButton from "./DeleteCategoryButton";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await getAdminCategories();

  return (
    <div className="px-8 py-10">
      <div className="mb-7 max-w-5xl">
        <h1 className="font-serif text-2xl text-ink">Categories</h1>
        <p className="text-sm text-muted mt-0.5">
          {categories.length} total — brands are used as categories on this store.
        </p>
      </div>

      <div className="grid gap-8 max-w-5xl lg:grid-cols-[1fr_320px]">
        {/* List */}
        <div className="bg-white rounded overflow-hidden">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted">
              <Tag size={32} strokeWidth={1} />
              <p className="text-sm">No categories yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone text-left">
                  <th className="px-5 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">
                    Slug
                  </th>
                  <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase text-right">
                    Products
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-stone/20 transition-colors ${
                      i < categories.length - 1 ? "border-b border-stone/50" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-ink">{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={
                          c.productCount === 0
                            ? "text-muted"
                            : "font-medium text-ink"
                        }
                      >
                        {c.productCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <DeleteCategoryButton
                        categoryId={c.id}
                        name={c.name}
                        productCount={c.productCount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create form */}
        <aside className="bg-white rounded p-5 h-fit">
          <h2 className="text-xs font-medium tracking-widest uppercase text-muted mb-4 pb-2 border-b border-stone">
            Add Category
          </h2>
          <NewCategoryForm />
          <p className="mt-4 text-xs text-muted/80 leading-relaxed">
            New categories can also be brands — e.g. Puma, Converse. They appear as
            a category option when creating products.
          </p>
        </aside>
      </div>
    </div>
  );
}
