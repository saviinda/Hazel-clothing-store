import React from 'react';
import Link from 'next/link';
import { supabase } from '@hazel/database';
import { Product, Category } from '@hazel/shared';
import ProductCard from '../../components/ProductCard';
import ShopFilters from '../../components/ShopFilters';

export const revalidate = 30; // ISR: reflect admin changes within 30 seconds

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; color?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const activeCategorySlug = params.category || '';
  const filterSize = params.size || '';
  const filterColor = params.color || '';
  const sortBy = params.sort || 'newest';

  let categories: Category[] = [];
  let products: Product[] = [];

  try {
    // 1. Fetch all active categories from DB
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    categories = catData ? (catData as Category[]) : [];

    // 2. Fetch all active products from DB
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false);

    // Apply category filter if selected
    if (activeCategorySlug) {
      const activeCat = categories.find((c) => c.slug === activeCategorySlug);
      if (activeCat) {
        query = query.eq('category_id', activeCat.id);
      }
    }

    const { data: prodData } = await query;
    products = prodData ? (prodData as unknown as Product[]) : [];
  } catch (err) {
    console.error('Shop page fetch error:', err);
  }

  // Apply filters
  let filteredProducts = [...products];

  if (activeCategorySlug) {
    const activeCat = categories.find((c) => c.slug === activeCategorySlug);
    if (activeCat) {
      filteredProducts = filteredProducts.filter((p) => p.category_id === activeCat.id);
    }
  }

  if (filterSize) {
    filteredProducts = filteredProducts.filter((p) => p.sizes.includes(filterSize));
  }

  if (filterColor) {
    filteredProducts = filteredProducts.filter((p) => p.colors.includes(filterColor));
  }

  // Sort
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  } else {
    filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Build filter options from live products
  const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes)));
  const allColors = Array.from(new Set(products.flatMap((p) => p.colors)));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:px-12 w-full">
      {/* Mobile Filters Toggle + Sort Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-brand-secondary/60">
            Showing <span className="font-bold text-brand-secondary">{filteredProducts.length}</span> products
          </p>
          <div className="flex gap-2 text-xs font-bold">
            <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=newest`} className={`min-h-[44px] inline-flex items-center px-3 border rounded ${sortBy === 'newest' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Newest</Link>
            <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=price-low`} className={`min-h-[44px] inline-flex items-center px-3 border rounded ${sortBy === 'price-low' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>↑ Price</Link>
            <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=price-high`} className={`min-h-[44px] inline-flex items-center px-3 border rounded ${sortBy === 'price-high' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>↓ Price</Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
      {/* Filters Sidebar — desktop always visible, mobile collapsible */}
      <ShopFilters
        categories={categories}
        allSizes={allSizes}
        allColors={allColors}
        activeCategorySlug={activeCategorySlug}
        filterSize={filterSize}
        filterColor={filterColor}
      />

      {/* Product Grid */}
      <main className="flex-1 space-y-8">
        {/* Top bar - desktop only (moved to top on mobile) */}
        <div className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-brand-primary-light/10 pb-6">
          <p className="text-sm font-semibold text-brand-secondary/60">
            Showing <span className="font-bold text-brand-secondary">{filteredProducts.length}</span> products
          </p>
        </div>

        {/* Products or empty state */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <p className="font-serif text-2xl font-light text-brand-secondary/50 italic">
              {products.length === 0 ? 'Products coming soon…' : 'No products match your filters.'}
            </p>
            {products.length > 0 && (
              <Link href="/shop" className="rounded bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-secondary transition">
                Clear Filters
              </Link>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
