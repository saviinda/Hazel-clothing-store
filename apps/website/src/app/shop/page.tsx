import React, { Suspense } from 'react';
import { supabase } from '@hazel/database';
import { Product, Category } from '@hazel/shared';
import ShopClient from '../../components/ShopClient';
import { Loader2 } from 'lucide-react';

export const revalidate = 30; // ISR: reflect admin changes within 30 seconds

export default async function ShopPage() {
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

    // 2. Fetch all active products from DB (fetch all active ones for fast client filtering)
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false);

    products = prodData ? (prodData as unknown as Product[]) : [];
  } catch (err) {
    console.error('Shop page fetch error:', err);
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    }>
      <ShopClient products={products} categories={categories} />
    </Suspense>
  );
}
