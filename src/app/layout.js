import "./globals.css";
import FloatingButtons from '@/components/FloatingButtons'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tcg-tournament.vercel.app'

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TCG Tournament Manager",
    template: "%s — TCG Tournament Manager",
  },
  description: "Free Swiss and Knockout tournament manager for trading card games. No account needed — create a room, share a code, let players join by QR.",
  keywords: ["TCG tournament", "Swiss pairings", "card game tournament", "Pokemon TCG tournament", "Magic the Gathering tournament", "tournament manager", "free tournament software"],
  authors: [{ name: "TCG Tournament Manager" }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: baseUrl,
    siteName: "TCG Tournament Manager",
    title: "TCG Tournament Manager",
    description: "Free Swiss and Knockout tournament manager for trading card games. No account needed.",
    images: [{ url: "/icons/icon.png", width: 512, height: 512, alt: "TCG Tournament Manager" }],
  },
  twitter: {
    card: "summary",
    title: "TCG Tournament Manager",
    description: "Free Swiss and Knockout tournament manager for trading card games. No account needed.",
    images: ["/icons/icon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TCG Tournament",
  },
  themeColor: "#0f172a",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TCG Tournament Manager",
  url: baseUrl,
  description: "Free Swiss and Knockout tournament manager for trading card games. No account needed — create a room, share a code, let players join by QR.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TCG Tournament" />
        <link rel="apple-touch-icon" href="/icons/icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <FloatingButtons />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}} />
      </body>
    </html>
  );
}
