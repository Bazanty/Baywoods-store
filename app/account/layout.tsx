"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, init } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/auth/signin");
    }
  }, [initialized, user, router]);

  if (!initialized || !user) return null;

  return <>{children}</>;
}
