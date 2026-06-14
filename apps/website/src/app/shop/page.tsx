import React from 'react';
import Link from 'next/link';
import { supabase } from '@hazel/database';
import { Product, Category } from '@hazel/shared';
import ProductCard from '../../components/ProductCard';

const STATIC_PRODUCTS: Product[] = [
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
    colors: ['Blue Floral', 'White Floral'],
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
    id: 'p1000000-0000-0000-0000-000000000003',
    name: 'Summer Wrap Dress',
    price: 3800.00,
    description: 'Classic wrap dress with tie closure.',
    sizes: ['M', 'L'],
    colors: ['Sage Green'],
    material: 'Viscose',
    stock_qty: 10,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'],
    category_id: 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a',
    sub_category_id: null,
    is_active: true,
    is_featured: false,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  },
  {
    id: 'p1000000-0000-0000-0000-000000000005',
    name: 'Classic White Crop Top',
    price: 2100.00,
    description: 'Essential ribbed cotton crop top.',
    sizes: ['S', 'M'],
    colors: ['White', 'Oatmeal'],
    material: 'Ribbed Cotton',
    stock_qty: 30,
    images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'],
    category_id: 'a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821',
    sub_category_id: null,
    is_active: true,
    is_featured: false,
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
    colors: ['Black', 'Emerald Green'],
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
    sizes: ['26', '28', '30'],
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
  },
  {
    id: 'p1000000-0000-0000-0000-000000000009',
    name: 'Sleek Straight Leg Jeans',
    price: 6200.00,
    description: 'Modern straight leg silhouette.',
    sizes: ['28', '30', '32'],
    colors: ['Mid Wash Denim', 'Charcoal Black'],
    material: 'Denim',
    stock_qty: 15,
    images: ['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&auto=format&fit=crop&q=80'],
    category_id: 'f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1',
    sub_category_id: null,
    is_active: true,
    is_featured: false,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  }
];

const STATIC_CATEGORIES: Category[] = [
  { id: 'd1a3b1a8-8b9a-4f51-b0e6-b31cfcf3dc8a', name: 'Dresses', slug: 'dresses', parent_category_id: null, image_url: null, is_active: true, created_at: '' },
  { id: 'a2f1c8a1-2d7c-4a3b-b2cb-2821dfcf3821', name: 'Tops', slug: 'tops', parent_category_id: null, image_url: null, is_active: true, created_at: '' },
  { id: 'f3c4e5a2-9b2f-4c8d-b3e1-872bcda567a1', name: 'Jeans', slug: 'jeans', parent_category_id: null, image_url: null, is_active: true, created_at: '' }
];

export const revalidate = 60; // ISR revalidate cache every 60 seconds

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
    // 1. Fetch categories
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    categories = catData ? (catData as Category[]) : STATIC_CATEGORIES;

    // 2. Fetch products
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false);

    // Apply category filter if active
    if (activeCategorySlug) {
      const activeCat = categories.find((c) => c.slug === activeCategorySlug);
      if (activeCat) {
        query = query.eq('category_id', activeCat.id);
      }
    }

    const { data: prodData, error } = await query;

    if (error || !prodData || prodData.length === 0) {
      products = STATIC_PRODUCTS;
    } else {
      products = prodData as unknown as Product[];
    }
  } catch (err) {
    categories = STATIC_CATEGORIES;
    products = STATIC_PRODUCTS;
  }

  // Apply Client-Side Filters to the dataset (safeguard for fallbacks or simple search query matching)
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
    // default: newest
    filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Unique sizes & colors for filter options
  const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes)));
  const allColors = Array.from(new Set(products.flatMap((p) => p.colors)));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 w-full flex flex-col md:flex-row gap-12">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
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
          </ul>
        </div>

        {/* Size Filters */}
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

        {/* Color Filters */}
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
                  <span className="h-3 w-3 rounded-full border border-brand-primary-light/45" style={{ backgroundColor: color.toLowerCase().includes('wash') || color.toLowerCase().includes('denim') ? '#8da9c4' : color.replace(/\s+/g, '').toLowerCase() }} />
                  {color}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Product Grid Area */}
      <main className="flex-1 space-y-8">
        {/* Top bar controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-brand-primary-light/10 pb-6">
          <p className="text-sm font-semibold text-brand-secondary/60">
            Showing <span className="font-bold text-brand-secondary">{filteredProducts.length}</span> products
          </p>
          
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold text-brand-secondary/45 uppercase tracking-wider">Sort by</span>
            <div className="relative">
              {/* Simple client selection using links */}
              <div className="flex gap-2 text-xs font-bold">
                <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=newest`} className={`p-2 px-3 border rounded ${sortBy === 'newest' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Newest</Link>
                <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=price-low`} className={`p-2 px-3 border rounded ${sortBy === 'price-low' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Price: Low-High</Link>
                <Link href={`/shop?${activeCategorySlug ? `category=${activeCategorySlug}&` : ''}${filterSize ? `size=${filterSize}&` : ''}${filterColor ? `color=${filterColor}&` : ''}sort=price-high`} className={`p-2 px-3 border rounded ${sortBy === 'price-high' ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary'}`}>Price: High-Low</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-brand-secondary/70 font-semibold text-lg">No products match your filter criteria.</p>
            <Link href="/shop" className="mt-4 rounded bg-brand-primary p-3 px-6 text-sm font-bold text-white hover:bg-brand-secondary transition">Clear Filters</Link>
          </div>
        )}
      </main>
    </div>
  );
}
