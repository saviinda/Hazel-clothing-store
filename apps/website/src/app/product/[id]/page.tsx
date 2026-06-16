import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@hazel/database';
import { Product } from '@hazel/shared';
import ProductDetails from '../../../components/ProductDetails';
import ProductCard from '../../../components/ProductCard';

export const revalidate = 60; // ISR cache regeneration every 60s

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('is_active', true)
      .eq('is_deleted', false);

    if (data && data.length > 0) {
      return data.map((prod) => ({ id: prod.id }));
    }
  } catch (e) {
    // Ignore and fall back to empty array, dynamic pages will be handled on-demand
  }

  return [];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Product | null = null;
  let relatedProducts: Product[] = [];

  try {
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .maybeSingle(); // Use maybeSingle to avoid throwing on not found

    if (prodData) {
      product = prodData as unknown as Product;
      
      const { data: relData } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .limit(4);

      if (relData) {
        relatedProducts = relData as unknown as Product[];
      }
    }
  } catch (err) {
    console.error('Error fetching product page details:', err);
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 w-full space-y-24">
      {/* Product Details Section */}
      <ProductDetails product={product} />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-10 border-t border-brand-primary-light/15 pt-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand-secondary">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
