"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker after the first paint. Skips registration
 * for the admin surface to keep that area side-effect free, and skips on
 * non-https/non-localhost contexts where `serviceWorker` is not allowed.
 */
export default function PWARegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const path = window.location.pathname;
    if (path.startsWith("/admin")) return;

    const isSecure = window.isSecureContext || location.hostname === "localhost";
    if (!isSecure) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Silent — failing registration must never break the page.
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
