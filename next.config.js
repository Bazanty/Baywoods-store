
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
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
