/**
 * Baywoods PWA service worker — foundational scaffold.
 *
 * Deliberately conservative: no fetch interception, no caching. Auth,
 * checkout, M-Pesa callbacks, admin actions and Supabase realtime all
 * continue to hit the network as before. This file exists to:
 *   1. Be registerable so the app counts as an installable PWA, and
 *   2. Provide a place to hook up Web Push when keys are configured.
 *
 * Add a fetch handler here only after caching strategy has been reviewed
 * against the order/checkout paths.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// --- Web Push (inactive until VAPID keys + a subscribe flow ship) ---

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Baywoods", body: event.data.text() };
  }
  const title = payload.title || "Baywoods Store";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          try {
            client.navigate(targetUrl);
            return client.focus();
          } catch {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
