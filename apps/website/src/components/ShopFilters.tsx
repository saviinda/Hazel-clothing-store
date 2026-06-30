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
  onFilterChange: (type: 'category' | 'size' | 'color' | 'clear', value: string) => void;
}

export default function ShopFilters({
  categories,
  allSizes,
  allColors,
  activeCategorySlug,
  filterSize,
  filterColor,
  onFilterChange,
}: ShopFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters = !!(activeCategorySlug || filterSize || filterColor);

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between gap-2 border border-brand-primary-light/30 rounded bg-white px-4 py-3 text-sm font-bold text-brand-secondary cursor-pointer"
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
              onFilterChange={onFilterChange}
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
          onFilterChange={onFilterChange}
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
  onFilterChange,
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
              onClick={(e) => { e.preventDefault(); onFilterChange('category', ''); }}
              className={`block py-1 hover:text-brand-primary transition ${!activeCategorySlug ? 'text-brand-primary' : 'text-brand-secondary/70'}`}
            >
              All Products
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/shop?category=${cat.slug}${filterSize ? `&size=${filterSize}` : ''}${filterColor ? `&color=${filterColor}` : ''}`}
                onClick={(e) => { e.preventDefault(); onFilterChange('category', cat.slug); }}
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
                  onClick={(e) => { e.preventDefault(); onFilterChange('size', size); }}
                  className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded border text-xs font-bold transition ${
                    active
                      ? 'border-brand-primary bg-brand-primary text-white border-brand-primary'
                      : 'border-brand-primary-light/30 bg-white text-brand-secondary hover:border-brand-primary border-brand-primary-light/30'
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
          <div className="flex flex-col gap-1">
            {allColors.map((color) => {
              const active = filterColor.toLowerCase().trim() === color.toLowerCase().trim();
              const id = `color-radio-${color.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <label
                  key={color}
                  htmlFor={id}
                  className="flex items-center gap-3 py-1.5 w-full cursor-pointer group select-none"
                >
                  <input
                    type="radio"
                    id={id}
                    name="color-filter"
                    value={color}
                    checked={active}
                    onChange={() => onFilterChange('color', color)}
                    onClick={() => { if (active) onFilterChange('color', color); }}
                    className="h-4 w-4 accent-brand-primary cursor-pointer flex-shrink-0"
                  />
                  <span className={`text-xs font-bold tracking-wide uppercase transition ${
                    active ? 'text-brand-primary' : 'text-brand-secondary/70 group-hover:text-brand-primary'
                  }`}>
                    {color}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear All */}
      {(activeCategorySlug || filterSize || filterColor) && (
        <Link
          href="/shop"
          onClick={(e) => { e.preventDefault(); onFilterChange('clear', ''); }}
          className="block text-xs font-bold text-red-500 hover:text-red-700 transition border border-red-200 rounded px-3 py-2 text-center"
        >
          Clear All Filters
        </Link>
      )}
    </>
  );
}
