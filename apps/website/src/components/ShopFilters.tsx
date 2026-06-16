'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Category } from '@hazel/shared';

interface ShopFiltersProps {
  categories: Category[];
  allSizes: string[];
  allColors: string[];
  activeCategorySlug: string;
  filterSize: string;
  filterColor: string;
}

export default function ShopFilters({
  categories,
  allSizes,
  allColors,
  activeCategorySlug,
  filterSize,
  filterColor,
}: ShopFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters = !!(activeCategorySlug || filterSize || filterColor);

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between gap-2 border border-brand-primary-light/30 rounded bg-white px-4 py-3 text-sm font-bold text-brand-secondary"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-brand-primary" />
            FILTERS
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white font-bold">
                {[activeCategorySlug, filterSize, filterColor].filter(Boolean).length}
              </span>
            )}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Mobile Filter Drawer */}
        {isOpen && (
          <div className="mt-2 border border-brand-primary-light/20 rounded bg-white p-5 space-y-6 shadow-md">
            <FilterContent
              categories={categories}
              allSizes={allSizes}
              allColors={allColors}
              activeCategorySlug={activeCategorySlug}
              filterSize={filterSize}
              filterColor={filterColor}
            />
          </div>
        )}
      </div>

      {/* Desktop Sidebar – always visible */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
        <FilterContent
          categories={categories}
          allSizes={allSizes}
          allColors={allColors}
          activeCategorySlug={activeCategorySlug}
          filterSize={filterSize}
          filterColor={filterColor}
        />
      </aside>
    </>
  );
}

function FilterContent({
  categories,
  allSizes,
  allColors,
  activeCategorySlug,
  filterSize,
  filterColor,
}: ShopFiltersProps) {
  return (
    <>
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
                  className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded border text-xs font-bold transition ${
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
                    className="h-3 w-3 rounded-full border border-brand-primary-light/45 flex-shrink-0"
                    style={{
                      backgroundColor:
                        color.toLowerCase().includes('wash') || color.toLowerCase().includes('denim')
                          ? '#8da9c4'
                          : color.replace(/\s+/g, '').toLowerCase(),
                    }}
                  />
                  {color}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear All */}
      {(activeCategorySlug || filterSize || filterColor) && (
        <Link
          href="/shop"
          className="block text-xs font-bold text-red-500 hover:text-red-700 transition border border-red-200 rounded px-3 py-2 text-center"
        >
          Clear All Filters
        </Link>
      )}
    </>
  );
}
