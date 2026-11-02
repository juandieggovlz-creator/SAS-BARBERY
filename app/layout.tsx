import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Outfit, Playfair_Display, Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://barberos.app'),
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
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import AccentColorProvider from "@/components/ui/AccentColorProvider";
import { accentInitScript } from "@/lib/accent-colors";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${outfit.variable} ${playfair.variable} ${cinzel.variable} ${jakarta.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-flash theme script */}
        <script
          id="barberos-theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
        {/* Anti-flash accent color script */}
        <script
          id="barberos-accent-init"
          dangerouslySetInnerHTML={{ __html: accentInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider>
          <AccentColorProvider>
            {children}
            <Toaster position="top-right" richColors closeButton duration={4000} visibleToasts={3} />
          </AccentColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
