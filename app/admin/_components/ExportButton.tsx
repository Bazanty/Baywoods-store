"use client";

import { Download } from "lucide-react";

interface Props {
  type: "orders" | "customers" | "products" | "inventory";
  label?: string;
}

export default function ExportButton({ type, label }: Props) {
  const display = label ?? `Export ${type} CSV`;
  return (
    <a
      href={`/api/admin/export/${type}`}
      download
      className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase px-3 py-2 border border-ink/25 text-ink hover:bg-ink hover:text-citrine transition-colors"
    >
      <Download size={12} strokeWidth={2} />
      {display}
    </a>
  );
}
