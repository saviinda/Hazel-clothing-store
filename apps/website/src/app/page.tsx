import React from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { supabase } from '@hazel/database';
import { Product } from '@hazel/shared';

// Fallback seed data in case Supabase is not connected yet
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    name: 'Blush Linen Midi Dress',
    price: 4200.00,
    description: 'A beautiful lightweight midi dress made of 100% pure linen.',
    sizes: ['S', 'M', 'L'],
    colors: ['Soft Blush'],
    material: 'Linen',
    stock_qty: 25,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'],
    category_id: 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a',
    sub_category_id: null,
    is_active: true,
    is_featured: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  {
    id: 'p1000000-0000-0000-0000-000000000002',
    name: 'Floral Puff Sleeve Dress',
    price: 4900.00,
    description: 'Feminine and elegant floral dress with puff sleeves.',
    sizes: ['S', 'M'],
    colors: ['Blue Floral'],
    material: 'Georgette',
    stock_qty: 15,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80'],
    category_id: 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a',
    sub_category_id: null,
    is_active: true,
    is_featured: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  {
    id: 'p1000000-0000-0000-0000-000000000006',
    name: 'Ribbed Square Neck Top',
    price: 2400.00,
    description: 'Flattering square neck top with short sleeves.',
    sizes: ['S', 'M', 'L'],
    colors: ['Mocha Brown', 'Black'],
    material: 'Ribbed Cotton',
    stock_qty: 22,
    images: ['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&auto=format&fit=crop&q=80'],
    category_id: 'a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821',
    sub_category_id: null,
    is_active: true,
    is_featured: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  {
    id: 'p1000000-0000-0000-0000-000000000008',
    name: 'High-Waist Mom Jeans',
    price: 5800.00,
    description: 'Comfortable high rise denim mom jeans.',
    sizes: ['28', '30'],
    colors: ['Light Wash Denim'],
    material: 'Denim',
    stock_qty: 8,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80'],
    category_id: 'f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1',
    sub_category_id: null,
    is_active: true,
    is_featured: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  }
];

export const revalidate = 60; // Incremental Static Regeneration: update page cache every 60s

export default async function Home() {
  let products: Product[] = [];
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .limit(4);

    if (error || !data || data.length === 0) {
      products = FALLBACK_PRODUCTS;
    } else {
      products = data as unknown as Product[];
    }
  } catch (err) {
    products = FALLBACK_PRODUCTS;
  }

  return (
    <div className="flex flex-col w-full pb-20">
      {/* 1. Hero Banner Section */}
      <section className="relative h-[80vh] w-full bg-black overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-brand-secondary/40 z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
          alt="Hazel Clothing Hero Banners"
          className="absolute h-full w-full object-cover object-center z-0 animate-fade-in"
        />

        {/* Content Box */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center text-center px-6">
          <span className="font-serif text-brand-primary-light text-2xl md:text-3xl tracking-wider mb-2 font-medium italic">
            Trending Collection
          </span>
          <h1 className="font-sans text-4xl md:text-7xl font-bold tracking-widest text-brand-primary-cream leading-tight uppercase max-w-4xl">
            Embrace Your Unique Style
          </h1>
          <p className="mt-4 text-brand-primary-cream/80 text-sm md:text-lg max-w-xl font-medium tracking-wide">
            Discover modern silhouettes and warm feminine tones tailored for you.
          </p>
          <div className="mt-10">
            <Link
              href="/shop"
              className="rounded bg-brand-primary p-4 px-10 text-xs font-bold tracking-widest text-white hover:bg-brand-secondary transition duration-300"
            >
              SHOP NEW ARRIVALS
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Trust Bar */}
      <section className="bg-brand-primary-light/10 border-y border-brand-primary-light/10 py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <h4 className="font-sans text-sm font-bold tracking-wider text-brand-secondary uppercase">ISLAND-WIDE DELIVERY</h4>
            <p className="text-xs text-brand-secondary/60">Delivered straight to your doorstep across Sri Lanka.</p>
          </div>
          <div className="space-y-1 border-y border-brand-primary-light/20 py-4 md:border-y-0 md:border-x md:py-0">
            <h4 className="font-sans text-sm font-bold tracking-wider text-brand-secondary uppercase">EASY BANK TRANSFERS</h4>
            <p className="text-xs text-brand-secondary/60">Upload receipt screenshots at checkout for instant verification.</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-sans text-sm font-bold tracking-wider text-brand-secondary uppercase">FEMININE SILHOUETTES</h4>
            <p className="text-xs text-brand-secondary/60">Sizes S to XL tailored to flatter young women aged 15-40.</p>
          </div>
        </div>
      </section>

      {/* 3. Category Feature Blocks */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-12 w-full">
        <div className="text-center mb-16 space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-secondary">Browse by Category</h2>
          <div className="h-0.5 w-16 bg-brand-primary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Dresses Category Card */}
          <Link href="/shop?category=dresses" className="group relative aspect-[4/5] overflow-hidden bg-zinc-200 rounded">
            <div className="absolute inset-0 bg-brand-secondary/30 group-hover:bg-brand-secondary/45 transition duration-300 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80"
              alt="Dresses Collection"
              className="absolute h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-6">
              <span className="font-serif text-2xl font-bold tracking-wider">Dresses</span>
              <span className="text-xs tracking-widest uppercase mt-2 border-b border-white pb-1 opacity-0 group-hover:opacity-100 transition duration-300">Shop Now</span>
            </div>
          </Link>

          {/* Tops Category Card */}
          <Link href="/shop?category=tops" className="group relative aspect-[4/5] overflow-hidden bg-zinc-200 rounded">
            <div className="absolute inset-0 bg-brand-secondary/30 group-hover:bg-brand-secondary/45 transition duration-300 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80"
              alt="Tops Collection"
              className="absolute h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-6">
              <span className="font-serif text-2xl font-bold tracking-wider">Tops</span>
              <span className="text-xs tracking-widest uppercase mt-2 border-b border-white pb-1 opacity-0 group-hover:opacity-100 transition duration-300">Shop Now</span>
            </div>
          </Link>

          {/* Jeans Category Card */}
          <Link href="/shop?category=jeans" className="group relative aspect-[4/5] overflow-hidden bg-zinc-200 rounded">
            <div className="absolute inset-0 bg-brand-secondary/30 group-hover:bg-brand-secondary/45 transition duration-300 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80"
              alt="Jeans Collection"
              className="absolute h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-6">
              <span className="font-serif text-2xl font-bold tracking-wider">Jeans</span>
              <span className="text-xs tracking-widest uppercase mt-2 border-b border-white pb-1 opacity-0 group-hover:opacity-100 transition duration-300">Shop Now</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. New Arrivals Showcase */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-12 w-full">
        <div className="text-center mb-16 space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-secondary">Trending New Arrivals</h2>
          <div className="h-0.5 w-16 bg-brand-primary mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 5. Customer Reviews (Social Proof) */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-12 w-full">
        <div className="text-center mb-16 space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-secondary">Loved by Customers</h2>
          <div className="h-0.5 w-16 bg-brand-primary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-brand-primary-cream border border-brand-primary-light/25 p-8 rounded space-y-4">
            <div className="flex text-yellow-500">★★★★★</div>
            <p className="text-sm italic text-brand-secondary/80">
              "Absolutely love the Blush Linen Midi Dress! The fabric is perfect for Colombo weather and the fit is spot on."
            </p>
            <h5 className="font-bold text-xs tracking-widest text-brand-secondary uppercase">— Shenali D.</h5>
          </div>

          <div className="bg-brand-primary-cream border border-brand-primary-light/25 p-8 rounded space-y-4">
            <div className="flex text-yellow-500">★★★★★</div>
            <p className="text-sm italic text-brand-secondary/80">
              "Bought the Mom Jeans and White Crop Top. Both look exactly like the photos on their Instagram. Shipping was super fast!"
            </p>
            <h5 className="font-bold text-xs tracking-widest text-brand-secondary uppercase">— Ishini W.</h5>
          </div>

          <div className="bg-brand-primary-cream border border-brand-primary-light/25 p-8 rounded space-y-4">
            <div className="flex text-yellow-500">★★★★★</div>
            <p className="text-sm italic text-brand-secondary/80">
              "Order procedure was very easy. Just uploaded my bank receipt and order status updated on the tracking link in 1 hour."
            </p>
            <h5 className="font-bold text-xs tracking-widest text-brand-secondary uppercase">— Sanduni P.</h5>
          </div>
        </div>
      </section>
    </div>
  );
}
