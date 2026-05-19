import "./globals.css";
import FloatingButtons from '@/components/FloatingButtons'

export const metadata = {
  title: "TCG Tournament Manager",
  description: "Run Swiss and Knockout TCG tournaments at home",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TCG Tournament",
  },
  themeColor: "#0f172a",
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
