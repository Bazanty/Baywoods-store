"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
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
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/sale" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
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
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-beige/95 backdrop-blur-sm shadow-[0_1px_0_0_#E2DDD6]" : "bg-transparent"
        )}
      >
        <div className="container-px">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="font-serif text-xl lg:text-2xl font-semibold tracking-wider text-ink"
            >
              BAYWOODS
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) =>
                link.mega ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                  >
                    <button className="flex items-center gap-1 text-sm font-medium tracking-wide text-ink/80 hover:text-ink transition-colors">
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={cn("transition-transform duration-200", megaOpen && "rotate-180")}
                      />
                    </button>

                    <AnimatePresence>
                      {megaOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[480px] bg-cream border border-stone p-8 shadow-xl"
                        >
                          <div className="grid grid-cols-3 gap-8">
                            {link.columns?.map((col) => (
                              <div key={col.title}>
                                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted mb-4">
                                  {col.title}
                                </p>
                                <ul className="space-y-2.5">
                                  {col.items.map((item) => (
                                    <li key={item.label}>
                                      <Link
                                        href={item.href}
                                        onClick={() => setMegaOpen(false)}
                                        className="text-sm text-ink/70 hover:text-forest transition-colors"
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
                    className="text-sm font-medium tracking-wide text-ink/80 hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 text-ink/70 hover:text-ink transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="p-2.5 text-ink/70 hover:text-ink transition-colors hidden sm:block"
                aria-label="Wishlist"
              >
                <Heart size={18} />
              </Link>

              {/* Account */}
              <Link
                href={user ? "/account" : "/auth/signin"}
                className="p-2.5 text-ink/70 hover:text-ink transition-colors hidden sm:block"
                aria-label="Account"
              >
                <User size={18} />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2.5 text-ink/70 hover:text-ink transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {mounted && itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-forest text-white text-[10px] font-semibold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2.5 text-ink/70 hover:text-ink transition-colors lg:hidden"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
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
              transition={{ duration: 0.25 }}
              className="border-t border-stone overflow-hidden bg-cream"
            >
              <div className="container-px py-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                  className="flex items-center gap-3"
                >
                  <Search size={16} className="text-muted shrink-0" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shoes, hoodies, caps..."
                    className="flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-muted hover:text-ink transition-colors"
                  >
                    <X size={16} />
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
              className="fixed inset-0 bg-ink/30 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-cream z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-stone">
                <span className="font-serif text-xl tracking-wider">BAYWOODS</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-6 space-y-1">
                {navLinks.map((link) => (
                  <div key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-base font-medium text-ink border-b border-stone/50 hover:text-forest transition-colors"
                    >
                      {link.label}
                    </Link>
                    {link.mega &&
                      link.columns?.flatMap((col) =>
                        col.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2 pl-4 text-sm text-muted hover:text-forest transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))
                      )}
                  </div>
                ))}
              </nav>
              <div className="p-6 border-t border-stone flex gap-4">
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-ink"
                >
                  <User size={16} /> Account
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-ink/70 hover:text-ink"
                >
                  <Heart size={16} /> Wishlist
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
