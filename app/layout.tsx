import { getCanonicalAppUrl } from '@/lib/url'
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barberos.app';

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: "BarberOS – El Sistema Operativo para Barberías Profesionales",
  description: "Gestiona reservas online, finanzas, comisiones, agenda y la página web de tu barbería desde una sola plataforma. Prueba gratis 14 días.",
  keywords: "barbería software, gestión barbería, reservas online barbería, sistema barbería Colombia",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  openGraph: {
    title: "BarberOS – Plataforma SaaS para Barberías",
    description: "Todo tu negocio en una sola plataforma. Reservas 24/7, caja ciega, comisiones automáticas y tu propia página web.",
    type: "website",
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'BarberOS Logo' }],
  },
};

import { Toaster } from "sonner";
import Script from "next/script";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import AccentColorProvider from "@/components/ui/AccentColorProvider";
import { accentInitScript } from "@/lib/accent-colors";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* Anti-flash theme script */}
        <Script
          id="barberos-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {/* Anti-flash accent color script */}
        <Script
          id="barberos-accent-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: accentInitScript }}
        />
        <ThemeProvider>
          <AccentColorProvider>
            {children}
            <CookieConsentBanner />
            <Toaster position="top-right" richColors closeButton duration={4000} visibleToasts={3} />
          </AccentColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
