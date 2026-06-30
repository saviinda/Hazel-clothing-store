'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, Category } from '@hazel/shared';
import ProductCard from './ProductCard';
import ShopFilters from './ShopFilters';
import Link from 'next/link';

interface ShopClientProps {
  products: Product[];
  categories: Category[];
}

export default function ShopClient({ products, categories }: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Client states sync'd with URL
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeSize, setActiveSize] = useState(searchParams.get('size') || '');
  const [activeColor, setActiveColor] = useState(searchParams.get('color') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  // Sync state if searchParams change externally (e.g. browser back/forward)
  useEffect(() => {
    setActiveCategory(searchParams.get('category') || '');
    setActiveSize(searchParams.get('size') || '');
    setActiveColor(searchParams.get('color') || '');
    setSortBy(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  // Handle updates to state & URL
  const handleFilterChange = (type: 'category' | 'size' | 'color' | 'sort' | 'clear', value: string) => {
    let nextCat = activeCategory;
    let nextSize = activeSize;
    let nextColor = activeColor;
    let nextSort = sortBy;

    if (type === 'category') {
      nextCat = value;
    } else if (type === 'size') {
      nextSize = activeSize.toLowerCase().trim() === value.toLowerCase().trim() ? '' : value; // toggle size
    } else if (type === 'color') {
      nextColor = activeColor.toLowerCase().trim() === value.toLowerCase().trim() ? '' : value; // toggle color
    } else if (type === 'sort') {
      nextSort = value;
    } else if (type === 'clear') {
      nextCat = '';
      nextSize = '';
      nextColor = '';
      nextSort = 'newest';
    }

    // Set local state immediately for instant feedback
    setActiveCategory(nextCat);
    setActiveSize(nextSize);
    setActiveColor(nextColor);
    setSortBy(nextSort);

    // Update URL
    const params = new URLSearchParams();
    if (nextCat) params.set('category', nextCat);
    if (nextSize) params.set('size', nextSize);
    if (nextColor) params.set('color', nextColor);
    if (nextSort && nextSort !== 'newest') params.set('sort', nextSort);

    const query = params.toString();
    router.replace(`/shop${query ? `?${query}` : ''}`, { scroll: false });
  };

  // Filter in memory for instant feedback
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory) {
      const activeCat = categories.find((c) => c.slug === activeCategory);
      if (activeCat) {
        result = result.filter((p) => p.category_id === activeCat.id);
      }
    }

    if (activeSize) {
      result = result.filter((p) =>
        p.sizes.some(s => s.toLowerCase().trim() === activeSize.toLowerCase().trim())
      );
    }

    if (activeColor) {
      result = result.filter((p) =>
        p.colors.some(c => c.toLowerCase().trim() === activeColor.toLowerCase().trim())
      );
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, activeCategory, activeSize, activeColor, sortBy, categories]);

  // Derived filter options from all products
  const allSizes = useMemo(() => Array.from(new Set(products.flatMap((p) => p.sizes))), [products]);
  const allColors = useMemo(() => Array.from(new Set(products.flatMap((p) => p.colors))), [products]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:px-12 w-full">
      {/* Mobile Filters Toggle + Sort Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-brand-secondary/60">
            Showing <span className="font-bold text-brand-secondary">{filteredProducts.length}</span> products
          </p>
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => handleFilterChange('sort', 'newest')}
              className={`min-h-[44px] cursor-pointer inline-flex items-center px-3 border rounded ${sortBy === 'newest' ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white text-brand-secondary border-brand-primary-light/35'}`}
            >
              Newest
            </button>
            <button
              onClick={() => handleFilterChange('sort', 'price-low')}
              className={`min-h-[44px] cursor-pointer inline-flex items-center px-3 border rounded ${sortBy === 'price-low' ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white text-brand-secondary border-brand-primary-light/35'}`}
            >
              ↑ Price
            </button>
            <button
              onClick={() => handleFilterChange('sort', 'price-high')}
              className={`min-h-[44px] cursor-pointer inline-flex items-center px-3 border rounded ${sortBy === 'price-high' ? 'bg-brand-secondary text-white border-brand-secondary' : 'bg-white text-brand-secondary border-brand-primary-light/35'}`}
            >
              ↓ Price
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Filters Sidebar */}
        <ShopFilters
          categories={categories}
          allSizes={allSizes}
          allColors={allColors}
          activeCategorySlug={activeCategory}
          filterSize={activeSize}
          filterColor={activeColor}
          onFilterChange={handleFilterChange}
        />

        {/* Product Grid */}
        <main className="flex-1 space-y-8">
          {/* Top bar - desktop only */}
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
                <button
                  onClick={() => handleFilterChange('clear', '')}
                  className="rounded bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-secondary transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
