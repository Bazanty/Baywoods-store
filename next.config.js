
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  async headers() {
    return [
      {
        // Service workers must not be cached by the browser or a CDN.
        // Browsers will recheck /sw.js on every navigator.serviceWorker.register()
        // call (typically each page load) and apply updates when the byte content
        // changes. Keeping max-age=0 ensures a stale SW is never served.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          // Explicitly allow the SW to control the full origin. The default
          // max-scope for a script at /sw.js is already /, but some strict
          // browser interpretations appreciate an explicit header.
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  images: {
    // In dev the local server can't always reach Cloudinary CDN (DNS), so let
    // the browser fetch images directly from their origin. In production
    // (Vercel) the optimizer runs fine and we keep the performance benefits.
    unoptimized: isDev,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  serverExternalPackages: ["@sentry/nextjs"],
};

module.exports = nextConfig;
