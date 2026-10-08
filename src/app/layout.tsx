import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BRAND } from "@/config/brand";
import "./globals.css";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — Recrutement Basketball 2026-2027`, template: `%s · ${BRAND.name}` },
  description: `${BRAND.name} — ${BRAND.city}. Recrutement de l'équipe de basketball pour l'année académique 2026-2027.`,
  icons: { icon: BRAND.logoSrc, apple: BRAND.logoSrc },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
