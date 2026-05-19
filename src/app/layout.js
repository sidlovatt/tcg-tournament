import "./globals.css";

export const metadata = {
  title: "TCG Tournament Manager",
  description: "Run Swiss and Knockout TCG tournaments at home",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}
