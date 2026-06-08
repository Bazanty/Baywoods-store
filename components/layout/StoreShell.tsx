"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import PWARegistrar from "./PWARegistrar";
import ChatWidget from "@/components/chat/ChatWidget";
import { useAuthStore } from "@/lib/authStore";

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");
  const { initialized, init } = useAuthStore();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <ChatWidget />
      <PWARegistrar />
    </>
  );
}
