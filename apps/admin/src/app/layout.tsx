import type { Metadata } from "next";
import { Inter, Poppins, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import AdminShell from "../components/AdminShell";

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

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hazel Clothing | Admin Panel",
  description: "Management portal for Hazel Clothing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-primary-cream text-brand-secondary">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
