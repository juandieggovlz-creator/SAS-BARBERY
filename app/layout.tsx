import { getCanonicalAppUrl } from '@/lib/url'
import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: "BarberOS – El Sistema Operativo para Barberías Profesionales",
  description: "Gestiona reservas online, finanzas, comisiones, agenda y la página web de tu barbería desde una sola plataforma. Prueba gratis 1 mes.",
  keywords: "barbería software, gestión barbería, reservas online barbería, sistema barbería Colombia",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: "BarberOS – Plataforma Integral para Barberías",
    description: "Todo tu negocio en una sola plataforma. Reservas 24/7, caja ciega, comisiones automáticas y tu propia página web.",
    type: "website",
    images: [{ url: '/logo-dark.png', width: 512, height: 512, alt: 'BarberOS Logo' }],
  },
};

import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { ThemeProvider, themeInitScript, Theme } from "@/lib/theme";
import { accentInitScript } from "@/lib/accent-colors";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import OfflineDetector from "@/components/errors/OfflineDetector";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get('barberos-theme')?.value;
  // Regla del sistema: 'dark' es el tema predeterminado para cualquier visitante nuevo.
  const initialTheme: Theme = savedTheme === 'light' ? 'light' : 'dark';
  const isDark = initialTheme === 'dark';

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased ${isDark ? 'dark' : ''}`}
      data-theme={initialTheme}
      style={{ colorScheme: initialTheme }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: accentInitScript }} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#f8fafc] dark:bg-[#09090b]">
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <OfflineDetector />
          <CookieConsentBanner />
          <Toaster position="top-right" richColors closeButton duration={4000} visibleToasts={3} />
        </ThemeProvider>
      </body>
    </html>
  );
}
