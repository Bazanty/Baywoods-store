"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Heart, User, ShoppingBag, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    label: "Shop",
    href: "/shop",
    mega: true,
    columns: [
      {
        title: "Clothing",
        items: [
          { label: "Hoodies", href: "/shop/hoodies" },
          { label: "Shirts", href: "/shop/shirts" },
          { label: "Sweatpants", href: "/shop/sweatpants" },
          { label: "Joggers", href: "/shop/joggers" },
          { label: "Jorts", href: "/shop/jorts" },
        ],
      },
      {
        title: "Footwear & Extras",
        items: [
          { label: "Shoes", href: "/shop/shoes" },
          { label: "Caps", href: "/shop/caps" },
          { label: "Belts", href: "/shop/belts" },
          { label: "Accessories", href: "/shop/accessories" },
        ],
      },
      {
        title: "Highlights",
        items: [
          { label: "New Arrivals", href: "/new-arrivals" },
          { label: "Best Sellers", href: "/shop?sort=best-selling" },
          { label: "Sale", href: "/sale" },
          { label: "All Products", href: "/shop" },
        ],
      },
    ],
  },
  { label: "New", href: "/new-arrivals" },
  { label: "Sale", href: "/sale" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const user = useAuthStore((s) => s.user);

  useEffect(() => setMounted(true), []);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-200 border-b",
          scrolled
            ? "bg-cream border-ink/15"
            : "bg-cream/80 backdrop-blur-[2px] border-transparent"
        )}
      >
        <div className="container-px">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo — wordmark (cream + gold) reads cleanly on the dark header */}
            <Link href="/" className="flex items-center group" aria-label="Baywoods — home">
              <span className="font-display text-xl lg:text-2xl font-semibold uppercase tracking-[-0.02em] text-cream leading-none">
                Bay<span className="text-gold">woods</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) =>
                link.mega ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                  >
                    <button
                      className={cn(
                        "font-mono text-[11px] tracking-[0.16em] uppercase transition-colors py-2",
                        megaOpen ? "text-ink" : "text-ink/70 hover:text-ink"
                      )}
                    >
                      {link.label}
                    </button>

                    <AnimatePresence>
                      {megaOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[540px] bg-cream border border-ink/15 p-8"
                        >
                          <div className="grid grid-cols-3 gap-10">
                            {link.columns?.map((col, idx) => (
                              <div key={col.title}>
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
                                  <span className="text-ink">0{idx + 1}</span>
                                  {" / "}
                                  {col.title}
                                </p>
                                <ul className="space-y-2.5">
                                  {col.items.map((item) => (
                                    <li key={item.label}>
                                      <Link
                                        href={item.href}
                                        onClick={() => setMegaOpen(false)}
                                        className="font-display text-base text-ink/80 hover:text-ink hover:underline-citrine transition-all"
                                      >
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink/70 hover:text-ink transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <ThemeToggle />

              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-ink/70 hover:text-ink transition-colors"
                aria-label="Search"
              >
                <Search size={16} strokeWidth={1.75} />
              </button>

              <Link
                href="/account/wishlist"
                className="p-2 text-ink/70 hover:text-ink transition-colors hidden sm:block"
                aria-label="Wishlist"
              >
                <Heart size={16} strokeWidth={1.75} />
              </Link>

              <Link
                href={user ? "/account" : "/auth/signin"}
                className="p-2 text-ink/70 hover:text-ink transition-colors hidden sm:block"
                aria-label="Account"
              >
                <User size={16} strokeWidth={1.75} />
              </Link>

              <button
                onClick={openCart}
                className="relative p-2 text-ink/70 hover:text-ink transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={16} strokeWidth={1.75} />
                {mounted && itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-ink text-citrine font-mono text-[10px] font-medium flex items-center justify-center"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-ink/70 hover:text-ink transition-colors lg:hidden"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="border-t border-ink/15 overflow-hidden bg-cream"
            >
              <div className="container-px py-4">
                <form onSubmit={submitSearch} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">FIND</span>
                  <Search size={14} className="text-muted shrink-0" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shoes, hoodies, caps..."
                    className="flex-1 bg-transparent text-ink text-base outline-none placeholder:text-muted font-display"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-muted hover:text-ink transition-colors"
                  >
                    <X size={14} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed top-0 left-0 bottom-0 w-[88%] max-w-sm bg-cream z-50 lg:hidden flex flex-col border-r border-ink/15"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-ink/15">
                <span className="font-display text-xl font-semibold uppercase tracking-[-0.02em] text-cream leading-none">
                  Bay<span className="text-gold">woods</span>
                </span>
                <button onClick={() => setMobileOpen(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitSearch} className="px-6 py-4 border-b border-ink/15">
                <div className="flex items-center gap-3 border-b border-ink/30 pb-2">
                  <Search size={14} className="text-muted shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                  />
                </div>
              </form>

              <nav className="flex-1 overflow-y-auto px-6 py-4">
                {navLinks.map((link, i) => (
                  <div key={link.label} className="border-b border-ink/10 py-3">
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-baseline gap-3 group"
                    >
                      <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
                        0{i + 1}
                      </span>
                      <span className="font-display text-2xl tracking-[-0.02em] text-ink group-hover:underline-citrine">
                        {link.label}
                      </span>
                    </Link>
                    {link.mega && (
                      <div className="mt-2 pl-9 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {link.columns?.flatMap((col) =>
                          col.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="text-xs text-muted hover:text-ink transition-colors"
                            >
                              {item.label}
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="px-6 py-4 border-t border-ink/15 grid grid-cols-2 gap-3">
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink border border-ink py-2.5 hover:bg-ink hover:text-cream transition-colors"
                >
                  <User size={12} /> Account
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink border border-ink py-2.5 hover:bg-ink hover:text-cream transition-colors"
                >
                  <Heart size={12} /> Wishlist
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
