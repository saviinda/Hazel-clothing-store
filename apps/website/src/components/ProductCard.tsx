'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@hazel/shared';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../store/useCart';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent details page navigation
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      size: product.sizes[0] || 'M',
      color: product.colors[0] || 'Default',
      image_url: product.images[0] || '/placeholder.jpg',
    });
  };

  return (
    <Link href={`/product/${product.id}`} className="group relative flex flex-col overflow-hidden bg-white border border-brand-primary-light/10 transition duration-300 hover:shadow-lg rounded">
      {/* Product Image Block */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0] || '/placeholder.jpg'}
          alt={product.name}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
        />

        {/* Hover Action Button Overlay */}
        <div className="absolute inset-0 flex items-end justify-center p-4 bg-brand-secondary/10 opacity-0 transition duration-300 group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            className="flex items-center justify-center gap-2 w-full rounded bg-brand-primary-cream/95 p-3 text-xs font-bold tracking-widest text-brand-secondary shadow-lg hover:bg-brand-primary hover:text-white transition duration-200"
          >
            <ShoppingBag size={14} />
            QUICK ADD
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="flex flex-col p-4 bg-brand-primary-cream/20 flex-1 justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-brand-secondary group-hover:text-brand-primary transition">
            {product.name}
          </h3>
          {product.material && (
            <p className="mt-1 text-[11px] text-brand-secondary/40 uppercase tracking-widest">{product.material}</p>
          )}
        </div>
        <p className="mt-3 text-sm font-bold text-brand-secondary">
          LKR {Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </Link>
  );
}
