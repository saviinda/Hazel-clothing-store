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
    <Link href={`/product/${product.id}`} className="group relative flex flex-col overflow-hidden bg-white border border-brand-primary-light/10 transition duration-500 hover:shadow-[0_12px_30px_rgba(181,131,141,0.08)] rounded-sm">
      {/* Product Image Block */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-primary-cream/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0] || '/placeholder.jpg'}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Hover Action Button Overlay */}
        <div className="absolute inset-0 flex items-end justify-center p-4 bg-brand-secondary/5 opacity-0 transition-all duration-500 group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            className="flex items-center justify-center gap-2 w-full rounded-sm bg-brand-primary p-3 text-[10px] font-semibold tracking-[0.2em] text-white shadow-lg hover:bg-brand-secondary transition duration-300 transform translate-y-2 group-hover:translate-y-0"
          >
            <ShoppingBag size={14} />
            QUICK ADD
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="flex flex-col p-4 bg-white flex-1 justify-between">
        <div className="space-y-1">
          <h3 className="font-serif text-base font-light tracking-wide text-brand-secondary group-hover:text-brand-primary transition duration-300">
            {product.name}
          </h3>
          {product.material && (
            <p className="text-[10px] text-brand-secondary-light/60 uppercase tracking-[0.15em] font-medium">{product.material}</p>
          )}
        </div>
        <p className="mt-3 font-serif text-sm font-normal text-brand-secondary">
          LKR {Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </Link>
  );
}
