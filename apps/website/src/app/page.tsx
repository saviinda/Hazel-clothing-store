import React from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { supabase } from '@hazel/database';
import { Product } from '@hazel/shared';

export const revalidate = 30; // ISR: re-fetch from DB every 30 seconds

export default async function Home() {
  let products: Product[] = [];
  let heroBanner = null;
  let testimonials = null;

  try {
    // 1. Fetch featured products
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(8);

    if (prodData && prodData.length > 0) {
      products = prodData as unknown as Product[];
    }

    // 2. Fetch hero banner and testimonials content from content table
    const { data: contentData } = await supabase
      .from('content')
      .select('*');

    if (contentData) {
      heroBanner = contentData.find(c => c.section_key === 'hero_banner')?.data;
      testimonials = contentData.find(c => c.section_key === 'testimonials')?.data?.reviews;
    }
  } catch (err) {
    console.error('Homepage data fetch error:', err);
  }

  // Hero banner fallback values
  const bannerImage = heroBanner?.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80";
  const bannerTitle = heroBanner?.title || "EMBRACE YOUR UNIQUE STYLE";
  const bannerSubtitle = heroBanner?.subtitle || "Discover modern silhouettes, delicate textures, and warm feminine tones tailored for young women.";
  const bannerCtaText = heroBanner?.cta_text || "SHOP NEW ARRIVALS";
  const bannerCtaLink = heroBanner?.cta_link || "/shop";

  return (
    <div className="flex flex-col w-full pb-20">
      {/* 1. Hero Banner */}
      <section className="relative min-h-[70vh] sm:min-h-[85vh] w-full bg-brand-secondary overflow-hidden flex items-end sm:items-stretch">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/80 via-brand-secondary/45 to-transparent z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerImage}
          alt="Hazel Clothing Hero"
          className="absolute h-full w-full object-cover object-center z-0 scale-105 animate-[scale-up_20s_ease-out_infinite_alternate]"
        />
        <div className="relative z-20 flex h-full flex-col items-start justify-end sm:justify-center text-left px-6 md:px-20 max-w-7xl mx-auto w-full pb-14 sm:pb-0">
          <span className="font-serif text-brand-primary-light text-sm sm:text-lg md:text-xl tracking-[0.25em] mb-3 font-light uppercase">
            Hazel Boutique
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-wide text-brand-primary-cream leading-[1.05] max-w-3xl uppercase break-words">
            {bannerTitle}
          </h1>
          <p className="mt-4 text-brand-primary-cream/85 text-xs sm:text-sm md:text-lg max-w-sm sm:max-w-xl font-light tracking-wide leading-relaxed font-sans">
            {bannerSubtitle}
          </p>
          <div className="mt-8">
            <Link
              href={bannerCtaLink}
              className="relative inline-flex items-center justify-center overflow-hidden border border-brand-primary bg-brand-primary p-3 px-8 sm:p-4 sm:px-12 text-[11px] font-bold tracking-[0.2em] text-white transition duration-500 rounded-sm group"
            >
              <span className="relative z-10">{bannerCtaText}</span>
              <div className="absolute inset-0 bg-brand-secondary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 z-0"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Trust Bar */}
      <section className="bg-white border-b border-brand-primary-light/10 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-6 md:px-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 text-center">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-[10px] tracking-[0.25em] font-semibold text-brand-primary/80 uppercase">01 / LOGISTICS</span>
            <h4 className="font-serif text-lg font-light text-brand-secondary tracking-wider">Island-Wide Delivery</h4>
            <p className="text-xs text-brand-secondary-light/70 max-w-xs leading-relaxed">Delivered straight to your doorstep across Sri Lanka.</p>
          </div>
          <div className="flex flex-col items-center space-y-2 border-y border-brand-primary-light/15 py-6 sm:border-y-0 sm:border-x sm:py-0">
            <span className="text-[10px] tracking-[0.25em] font-semibold text-brand-primary/80 uppercase">02 / PAYMENT</span>
            <h4 className="font-serif text-lg font-light text-brand-secondary tracking-wider">Easy Bank Transfers</h4>
            <p className="text-xs text-brand-secondary-light/70 max-w-xs leading-relaxed">Upload receipt screenshots at checkout for instant verification.</p>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <span className="text-[10px] tracking-[0.25em] font-semibold text-brand-primary/80 uppercase">03 / COUTURE</span>
            <h4 className="font-serif text-lg font-light text-brand-secondary tracking-wider">Feminine Silhouettes</h4>
            <p className="text-xs text-brand-secondary-light/70 max-w-xs leading-relaxed">Sizes S to XL tailored to flatter young women aged 15-40.</p>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Categories — pulled live from DB */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 md:px-12 w-full">
        <div className="text-center mb-10 sm:mb-16 space-y-2">
          <span className="text-brand-primary text-xs uppercase tracking-[0.3em] font-semibold block mb-2">Curated Collections</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-secondary tracking-wide">
            Browse by <span className="italic font-normal">Category</span>
          </h2>
          <div className="h-[1px] w-24 bg-brand-primary/40 mx-auto mt-4"></div>
        </div>
        <CategoryBlocks />
      </section>

      {/* 4. Featured Products — pulled live from DB */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:px-12 w-full">
        <div className="text-center mb-10 sm:mb-16 space-y-2">
          <span className="text-brand-primary text-xs uppercase tracking-[0.3em] font-semibold block mb-2">Our Favorites</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-secondary tracking-wide">
            Trending <span className="italic font-normal">New Arrivals</span>
          </h2>
          <div className="h-[1px] w-24 bg-brand-primary/40 mx-auto mt-4"></div>
        </div>

        {products.length > 0 ? (() => {
          const count = products.length;
          // Pick column count that keeps rows balanced
          let colClass = 'grid-cols-2 md:grid-cols-4';
          if (count === 1) colClass = 'grid-cols-1 max-w-xs mx-auto';
          else if (count === 2) colClass = 'grid-cols-2 max-w-lg mx-auto';
          else if (count === 3) colClass = 'grid-cols-2 sm:grid-cols-3 max-w-3xl mx-auto';
          else if (count % 4 === 0) colClass = 'grid-cols-2 md:grid-cols-4';
          else if (count % 3 === 0) colClass = 'grid-cols-2 md:grid-cols-3';
          else if (count % 2 === 0) colClass = 'grid-cols-2 md:grid-cols-4';
          else colClass = 'grid-cols-2 md:grid-cols-4'; // accept slight imbalance for 5/7
          return (
            <div className={`grid ${colClass} gap-8`}>
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          );
        })() : (
          <div className="text-center py-16 text-brand-secondary/40 font-serif text-xl italic">
            New arrivals coming soon…
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white transition duration-300 px-10 py-3 text-[11px] font-bold tracking-[0.2em] rounded-sm"
          >
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 md:px-12 w-full">
        <div className="text-center mb-10 sm:mb-16 space-y-2">
          <span className="text-brand-primary text-xs uppercase tracking-[0.3em] font-semibold block mb-2">Testimonials</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-secondary tracking-wide">
            Loved by <span className="italic font-normal">Customers</span>
          </h2>
          <div className="h-[1px] w-24 bg-brand-primary/40 mx-auto mt-4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {(testimonials && testimonials.length > 0 ? testimonials : [
            { comment: 'Absolutely love the Blush Linen Midi Dress! The fabric is perfect for Colombo weather and the fit is spot on.', name: 'Shenali D.', rating: 5 },
            { comment: 'Bought the Mom Jeans and White Crop Top. Both look exactly like the photos on their Instagram. Shipping was super fast!', name: 'Ishini W.', rating: 5 },
            { comment: 'Order procedure was very easy. Just uploaded my bank receipt and order status updated on the tracking link in 1 hour.', name: 'Sanduni P.', rating: 5 },
          ]).map((t: any, idx: number) => (
            <div key={idx} className="bg-white border border-brand-primary-light/15 p-8 rounded-sm shadow-[0_4px_20px_rgba(181,131,141,0.05)] hover:shadow-[0_10px_30px_rgba(181,131,141,0.1)] transition duration-500 space-y-6 relative">
              <div className="absolute top-6 right-8 text-brand-primary-light/20 text-6xl font-serif select-none pointer-events-none">"</div>
              <div className="flex text-brand-accent-gold text-sm tracking-wider">
                {Array.from({ length: t.rating || 5 }).map((_, i) => '★').join('')}
              </div>
              <p className="text-sm italic text-brand-secondary-light/95 leading-relaxed font-serif">"{t.comment || t.quote}"</p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-[1px] w-6 bg-brand-primary/40"></div>
                <h5 className="font-sans text-[10px] font-semibold tracking-[0.2em] text-brand-secondary uppercase">— {t.name}</h5>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


// ── Dynamic Category Blocks (server async component) ─────────────────────────
// Fetches categories from Supabase. Admin can add/edit/remove categories and
// they appear here within 30 seconds (ISR). Uses category.image_url when set,
// otherwise falls back to curated Unsplash images per slug.

const CATEGORY_IMAGES: Record<string, string> = {
  dresses: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
  tops:    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
  jeans:   'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
};

async function CategoryBlocks() {
  let categories: { id: string; name: string; slug: string; image_url: string | null }[] = [];
  try {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(6);
    if (data && data.length > 0) categories = data as typeof categories;
  } catch (_) {}

  if (categories.length === 0) {
    return (
      <div className="text-center py-10 text-brand-secondary/40 font-serif text-xl italic">
        Categories coming soon…
      </div>
    );
  }

  const gridClass =
    categories.length === 1 ? 'grid-cols-1 max-w-sm mx-auto'
    : categories.length === 2 ? 'grid-cols-2'
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className={`grid gap-8 ${gridClass}`}>
      {categories.map((cat) => {
        const imgSrc = cat.image_url || CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES.default;
        return (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group relative aspect-[4/5] overflow-hidden bg-brand-secondary rounded-sm shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 via-brand-secondary/20 to-transparent group-hover:from-brand-secondary/90 transition duration-500 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={`${cat.name} Collection`}
              className="absolute h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-4 border border-white/0 group-hover:border-white/20 transition duration-500 pointer-events-none z-10" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-end text-white p-6 sm:p-8 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition duration-500">
              <span className="font-serif text-2xl sm:text-3xl font-light tracking-wide italic text-center">{cat.name}</span>
              <span className="text-[10px] tracking-[0.25em] uppercase mt-3 text-brand-primary-light border-b border-brand-primary-light/40 pb-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition duration-500">
                Explore Collection
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
