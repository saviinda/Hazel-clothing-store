import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@hazel/database';
import { Product } from '@hazel/shared';
import ProductDetails from '../../../components/ProductDetails';
import ProductCard from '../../../components/ProductCard';

// Fallback seed data in case Supabase is not connected yet
const STATIC_PRODUCTS: Product[] = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    name: 'Blush Linen Midi Dress',
    price: 4200.00,
    description: 'A beautiful lightweight midi dress made of 100% pure linen. Perfect for Sri Lankan hot weather. Features adjustable straps and a comfortable fit.',
    sizes: ['S', 'M', 'L'],
    colors: ['Soft Blush', 'Dusty Rose'],
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
    description: 'Feminine and elegant floral dress with puff sleeves. Ideal for daytime outings and dates.',
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
    description: 'Classic wrap dress with tie closure. Easy to adjust and incredibly flattering.',
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
    description: 'Essential ribbed cotton crop top. A wardrobe staple that pairs with anything.',
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
    description: 'Flattering square neck top with short sleeves. Super soft texture.',
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
    description: 'Authentic denim feel mom jeans. Comfortable through the hips with a tapered leg.',
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
  }
];

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
    // Ignore and fall back to static params
  }

  return STATIC_PRODUCTS.map((prod) => ({ id: prod.id }));
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
      .single();

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
    } else {
      // Fallback lookup in local static list
      product = STATIC_PRODUCTS.find((p) => p.id === id) || null;
      if (product) {
        relatedProducts = STATIC_PRODUCTS.filter(
          (p) => p.category_id === product?.category_id && p.id !== product?.id
        ).slice(0, 4);
      }
    }
  } catch (err) {
    product = STATIC_PRODUCTS.find((p) => p.id === id) || null;
    if (product) {
      relatedProducts = STATIC_PRODUCTS.filter(
        (p) => p.category_id === product?.category_id && p.id !== product?.id
      ).slice(0, 4);
    }
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
