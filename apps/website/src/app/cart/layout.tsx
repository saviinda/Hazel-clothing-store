import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Bag | Hazel Clothing Boutique',
  description: 'Review items in your Hazel Clothing shopping bag and proceed to checkout.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
