'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../store/useCart';
import { ShoppingBag, Trash2, Plus, Minus, Loader2, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, updateQty, removeItem, getTotalPrice } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  const subtotal = getTotalPrice();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 md:px-12 md:py-16">
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-secondary md:text-4xl">Your Shopping Bag</h1>
        <div className="mx-auto mt-4 h-0.5 w-16 bg-brand-primary" />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-brand-primary-light/20 bg-white py-20 text-center shadow-sm">
          <ShoppingBag size={56} className="mb-4 text-brand-primary/40" />
          <p className="text-lg font-medium text-brand-secondary">Your shopping bag is empty.</p>
          <p className="mt-2 text-sm text-brand-secondary/60">Browse our collection and add your favourite pieces.</p>
          <Link
            href="/shop"
            className="mt-8 rounded bg-brand-primary px-8 py-3 text-sm font-bold tracking-wider text-white hover:bg-brand-secondary transition"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.size}-${item.color}`}
                className="flex gap-3 sm:gap-5 rounded-lg border border-brand-primary-light/15 bg-white p-3 sm:p-5 shadow-sm"
              >
                <div className="h-24 w-20 sm:h-28 sm:w-24 flex-shrink-0 overflow-hidden rounded bg-brand-primary-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url || '/logo.png'}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-4">
                      <h3 className="font-semibold text-brand-secondary text-sm sm:text-base">{item.name}</h3>
                      <span className="font-bold text-brand-secondary text-sm sm:text-base">LKR {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-sm text-brand-secondary/60">
                      Size: <span className="font-medium text-brand-secondary">{item.size}</span>
                      {' · '}
                      Color: <span className="font-medium text-brand-secondary">{item.color}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center rounded border border-brand-primary-light/30 bg-white">
                      <button
                        onClick={() => updateQty(item.product_id, item.size, item.color, item.qty - 1)}
                        className="p-2 text-brand-secondary/70 hover:text-brand-primary"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[2rem] text-center font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product_id, item.size, item.color, item.qty + 1)}
                        className="p-2 text-brand-secondary/70 hover:text-brand-primary"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id, item.size, item.color)}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-lg border border-brand-primary-light/15 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-brand-secondary">Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-brand-secondary/70">
                <span>Subtotal</span>
                <span>LKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-secondary/70">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <hr className="border-brand-primary-light/20" />
              <div className="flex justify-between text-lg font-bold text-brand-secondary">
                <span>Total</span>
                <span>LKR {subtotal.toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-brand-secondary/50">
              Island-wide delivery fee added at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-brand-secondary py-4 text-sm font-bold tracking-widest text-white hover:bg-brand-primary transition"
            >
              PROCEED TO CHECKOUT
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="mt-3 block text-center text-sm font-medium text-brand-primary hover:text-brand-secondary transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
