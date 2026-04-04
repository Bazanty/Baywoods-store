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

export const metadata: Metadata = {
  title: {
    default: "Baywoods Store — Kenyan Streetwear",
    template: "%s | Baywoods Store",
  },
  description:
    "Trend-forward streetwear and accessories. Shoes, hoodies, joggers, caps and more. M-Pesa accepted.",
  keywords: ["streetwear", "kenya", "fashion", "hoodies", "sneakers", "online shop"],
  openGraph: {
    title: "Baywoods Store",
    description: "Kenyan streetwear for the culture.",
    type: "website",
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
