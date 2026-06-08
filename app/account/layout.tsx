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

  if (!initialized || !user) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-start gap-4">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ LOADING</p>
        <div className="w-40 h-[3px] bg-ink/10 overflow-hidden">
          <div className="h-full w-1/2 bg-ink animate-pulse" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
