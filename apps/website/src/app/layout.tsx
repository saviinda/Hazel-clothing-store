import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hazel Clothing Boutique | Women's Fashion Sri Lanka",
  description: "Shop trendy dresses, tops, and jeans at Hazel Clothing Boutique. High-quality women's fashion with island-wide delivery and bank transfer verification.",
  keywords: ["Women's Clothing Sri Lanka", "Hazel Clothing Boutique", "Ladies Fashion Colombo", "Trendy Dresses Sri Lanka"],
  icons: { icon: '/logo.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-primary-cream text-brand-secondary">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
