import type { Metadata, Viewport } from "next";
import "./globals.css";
import { org } from "@/data/org";
import { ThemeProvider } from "@/components/ThemeProvider";
import { themeInitScript } from "@/lib/theme-script";
import { Analytics } from "@vercel/analytics/react";
import PWAInstaller from "@/components/PWAInstaller";
import { siteUrl } from "@/lib/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0d1117",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${org.name} — ${org.tagline}`,
    template: `%s — ${org.name}`,
  },
  description: org.description,
  applicationName: org.name,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: org.name,
    description: org.tagline,
    type: "website",
    locale: "en_PH",
    siteName: org.name,
    url: "/",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: org.name }],
  },
  twitter: {
    card: "summary",
    title: org.name,
    description: org.tagline,
    images: ["/icon-512.png"],
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/dm-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/outfit-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a
          href="#main"
          className="sr-only rounded-md bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
        {process.env.VERCEL ? <Analytics /> : null}
        <PWAInstaller />
      </body>
    </html>
  );
}
