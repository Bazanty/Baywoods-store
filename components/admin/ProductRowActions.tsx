"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, EyeOff, Eye, Loader2 } from "lucide-react";
import { toggleProductActive, deleteProduct } from "@/app/admin/actions";

interface Props {
  productId: string;
  isActive: boolean;
}

export default function ProductRowActions({ productId, isActive }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggle = () => {
    startTransition(() => toggleProductActive(productId, !isActive));
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProduct(productId);
      setConfirmDelete(false);
    });
  };

  if (confirmDelete) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-danger font-medium">Delete permanently?</span>
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-xs text-muted hover:text-ink transition-colors px-2 py-1"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-white bg-danger px-2.5 py-1 hover:bg-danger/85 transition-colors disabled:opacity-60 flex items-center gap-1"
        >
          {isPending && <Loader2 size={10} className="animate-spin" />}
          Yes, delete
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {isPending ? (
        <Loader2 size={13} className="text-muted animate-spin mr-1" />
      ) : (
        <button
          onClick={handleToggle}
          title={isActive ? "Set to draft" : "Set to active"}
          className="p-1.5 text-muted hover:text-ink transition-colors rounded"
        >
          {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}

      <Link
        href={`/admin/products/${productId}/edit`}
        className="p-1.5 text-muted hover:text-ink transition-colors rounded flex items-center gap-1 text-xs"
      >
        <Pencil size={13} />
        Edit
      </Link>

      <button
        onClick={() => setConfirmDelete(true)}
        title="Delete product"
        className="p-1.5 text-muted hover:text-danger transition-colors rounded"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
