import React from 'react';
import Link from 'next/link';
import { supabase } from '@hazel/database';
import { Product, Category } from '@hazel/shared';
import ProductCard from '../../components/ProductCard';

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
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 w-full flex flex-col md:flex-row gap-12">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
        {/* Categories */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-secondary/40 mb-4">Categories</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li>
              <Link
                href="/shop"
                className={`block py-1 hover:text-brand-primary transition ${!activeCategorySlug ? 'text-brand-primary' : 'text-brand-secondary/70'}`}
              >
                All Products
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/shop?category=${cat.slug}${filterSize ? `&size=${filterSize}` : ''}${filterColor ? `&color=${filterColor}` : ''}`}
                  className={`block py-1 hover:text-brand-primary transition ${activeCategorySlug === cat.slug ? 'text-brand-primary' : 'text-brand-secondary/70'}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-brand-secondary/35 italic text-xs">No categories yet</li>
            )}
          </ul>
        </div>

        {/* Size Filter */}
        {allSizes.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-secondary/40 mb-4">Filter By Size</h3>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((size) => {
                const active = filterSize === size;
                const link = `/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}size=${active ? '' : size}${filterColor ? `&color=${filterColor}` : ''}`;
                return (
                  <Link
                    key={size}
                    href={link}
                    className={`flex h-10 w-10 items-center justify-center rounded border text-xs font-bold transition ${
                      active
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-brand-primary-light/30 bg-white text-brand-secondary hover:border-brand-primary'
                    }`}
                  >
                    {size}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Filter */}
        {allColors.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-secondary/40 mb-4">Filter By Color</h3>
            <div className="flex flex-col gap-2 text-sm font-semibold">
              {allColors.map((color) => {
                const active = filterColor === color;
                const link = `/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}color=${active ? '' : color}`;
                return (
                  <Link
                    key={color}
                    href={link}
                    className={`flex items-center gap-2 py-1 hover:text-brand-primary transition ${active ? 'text-brand-primary' : 'text-brand-secondary/70'}`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-brand-primary-light/45"
                      style={{ backgroundColor: color.toLowerCase().includes('wash') || color.toLowerCase().includes('denim') ? '#8da9c4' : color.replace(/\s+/g, '').toLowerCase() }}
                    />
                    {color}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Product Grid */}
      <main className="flex-1 space-y-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-brand-primary-light/10 pb-6">
          <p className="text-sm font-semibold text-brand-secondary/60">
            Showing <span className="font-bold text-brand-secondary">{filteredProducts.length}</span> products
          </p>
          <div className="flex gap-2 text-xs font-bold">
            <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=newest`} className={`p-2 px-3 border rounded ${sortBy === 'newest' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Newest</Link>
            <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=price-low`} className={`p-2 px-3 border rounded ${sortBy === 'price-low' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Price: Low–High</Link>
            <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=price-high`} className={`p-2 px-3 border rounded ${sortBy === 'price-high' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Price: High–Low</Link>
          </div>
        </div>

        {/* Products or empty state */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
