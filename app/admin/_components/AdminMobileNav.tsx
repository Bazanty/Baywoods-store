"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminNav from "./AdminNav";

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-[#F4F4F2]/95 px-4 backdrop-blur lg:hidden">
        <div>
          <span className="font-serif text-xl tracking-wide text-ink">Baywoods</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">
            Admin Panel
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center border border-stone text-ink"
          aria-label="Open admin navigation"
          aria-expanded={open}
        >
          <Menu size={18} />
        </button>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-ink shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <span className="font-serif text-xl tracking-wide text-white">Baywoods</span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Admin Panel
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-white"
                aria-label="Close admin navigation"
              >
                <X size={18} />
              </button>
            </div>
            <AdminNav onNavigate={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
