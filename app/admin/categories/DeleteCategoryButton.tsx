"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "../actions";

interface Props {
  categoryId: string;
  name: string;
  productCount: number;
}

export default function DeleteCategoryButton({ categoryId, name, productCount }: Props) {
  const [pending, startTransition] = useTransition();

  const handle = () => {
    const msg =
      productCount > 0
        ? `Delete "${name}"? ${productCount} product(s) will become uncategorised.`
        : `Delete "${name}"?`;
    if (!confirm(msg)) return;

    startTransition(async () => {
      try {
        await deleteCategory(categoryId);
      } catch (err: any) {
        alert(err.message ?? "Failed to delete");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      title={`Delete ${name}`}
      className="p-1.5 text-muted hover:text-danger transition-colors disabled:opacity-40"
    >
      <Trash2 size={14} />
    </button>
  );
}
