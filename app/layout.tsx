import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import StoreShell from "@/components/layout/StoreShell";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baywoods.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Baywoods Store — Kenyan Streetwear",
    template: "%s | Baywoods Store",
  },
  description:
    "Trend-forward streetwear and accessories. Shoes, hoodies, joggers, caps and more. M-Pesa accepted.",
  keywords: ["streetwear", "kenya", "fashion", "hoodies", "sneakers", "online shop", "m-pesa"],
  applicationName: "Baywoods Store",
  authors: [{ name: "Baywoods" }],
  creator: "Baywoods",
  publisher: "Baywoods",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: SITE_URL,
    siteName: "Baywoods Store",
    title: "Baywoods Store — Kenyan Streetwear",
    description: "Kenyan streetwear for the culture. M-Pesa checkout, ships nationwide.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Baywoods Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baywoods Store",
    description: "Kenyan streetwear for the culture.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
