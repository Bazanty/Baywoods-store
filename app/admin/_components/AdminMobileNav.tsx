"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminNav from "./AdminNav";

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/15 bg-cream px-4 lg:hidden">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg tracking-[-0.02em] font-semibold text-ink">BAYWOODS</span>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
            / Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center border border-ink/25 text-ink hover:bg-ink hover:text-citrine transition-colors"
          aria-label="Open admin navigation"
          aria-expanded={open}
        >
          <Menu size={16} />
        </button>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-cream lg:hidden border-r border-ink/15">
            <div className="flex items-center justify-between border-b border-ink/15 px-6 py-5">
              <div>
                <span className="font-display text-lg tracking-[-0.02em] font-semibold text-ink">BAYWOODS</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted mt-1">
                  / Admin panel
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink"
                aria-label="Close admin navigation"
              >
                <X size={16} />
              </button>
            </div>
            <AdminNav onNavigate={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
