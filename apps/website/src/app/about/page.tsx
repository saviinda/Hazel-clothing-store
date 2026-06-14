import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Sparkles, Truck, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Hazel Clothing Boutique',
  description: "Learn about Hazel Clothing Boutique — modern women's fashion designed for Sri Lankan women.",
};

const VALUES = [
  {
    icon: Sparkles,
    title: 'Feminine & Modern',
    description: 'Curated silhouettes and soft tones that celebrate your unique style — from everyday essentials to statement pieces.',
  },
  {
    icon: Heart,
    title: 'Made for Sri Lanka',
    description: 'Fabrics and fits chosen with our tropical climate in mind. Breathable linens, comfortable denim, and versatile layers.',
  },
  {
    icon: Truck,
    title: 'Island-wide Delivery',
    description: 'We deliver across Sri Lanka with a flat-rate shipping fee. Track your order every step of the way.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted Payments',
    description: 'Pay securely via bank transfer. Upload your receipt and our team verifies payment within 2 hours.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-brand-secondary text-brand-primary-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-[0.3em] text-brand-primary-light uppercase">Our Story</p>
            <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
              Embrace Your Unique Style
            </h1>
            <p className="text-base leading-7 text-brand-primary-cream/75">
              Hazel Clothing Boutique was born from a simple belief: every woman deserves access to
              beautiful, well-fitted fashion that feels as good as it looks. Based in Colombo, we
              design and curate collections for young Sri Lankan women who want modern silhouettes
              with a feminine touch.
            </p>
            <p className="text-base leading-7 text-brand-primary-cream/75">
              From breezy linen dresses perfect for Colombo afternoons to versatile denim and
              everyday tops, every piece in our collection is chosen with care — because your
              wardrobe should work as hard as you do.
            </p>
            <Link
              href="/shop"
              className="inline-block rounded bg-brand-primary px-8 py-3 text-sm font-bold tracking-wider text-white hover:bg-brand-primary-light hover:text-brand-secondary transition"
            >
              SHOP THE COLLECTION
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
              alt="Hazel Clothing Boutique fashion"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-secondary">What We Stand For</h2>
          <div className="mx-auto mt-4 h-0.5 w-16 bg-brand-primary" />
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="rounded-lg border border-brand-primary-light/15 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-brand-secondary">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-secondary/65">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-brand-primary-cream border-y border-brand-primary-light/20">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:px-12">
          <h2 className="font-serif text-3xl font-bold text-brand-secondary">Our Mission</h2>
          <p className="mt-6 text-base leading-8 text-brand-secondary/70">
            To make quality women&apos;s fashion accessible across Sri Lanka — with honest pricing,
            reliable delivery, and a shopping experience that feels personal. We&apos;re building a
            brand that grows with our community, one beautiful outfit at a time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="rounded bg-brand-secondary px-8 py-3 text-sm font-bold tracking-wider text-white hover:bg-brand-primary transition"
            >
              GET IN TOUCH
            </Link>
            <Link
              href="/track"
              className="rounded border border-brand-secondary px-8 py-3 text-sm font-bold tracking-wider text-brand-secondary hover:bg-brand-secondary hover:text-white transition"
            >
              TRACK AN ORDER
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
