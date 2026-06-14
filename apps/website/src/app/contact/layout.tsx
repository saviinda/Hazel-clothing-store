import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Hazel Clothing Boutique',
  description: 'Get in touch with Hazel Clothing Boutique for orders, sizing help, and enquiries.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
