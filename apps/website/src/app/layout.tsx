import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import ScrollObserver from "../components/ScrollObserver";



export const metadata: Metadata = {
  title: "Hazel Clothing Boutique | Women's Fashion Sri Lanka",
  description: "Shop trendy dresses, tops, and jeans at Hazel Clothing Boutique. High-quality women's fashion with island-wide delivery and bank transfer verification.",
  keywords: ["Women's Clothing Sri Lanka", "Hazel Clothing Boutique", "Ladies Fashion Colombo", "Trendy Dresses Sri Lanka"],
  icons: { icon: '/logo.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-brand-primary-cream text-brand-secondary font-sans">
        <Header />
        <ScrollObserver />
        <main className="flex-1 flex flex-col">{children}</main>
        <BottomNav />
        <Footer />
      </body>
    </html>
  );
}
