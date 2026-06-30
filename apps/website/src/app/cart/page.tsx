'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../store/useCart';
import { ShoppingBag, Trash2, Plus, Minus, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQty, removeItem, getTotalPrice } = useCart();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-brand-primary-cream">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
      </div>
    );
  }

  const subtotal = getTotalPrice();

  const handleCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (checkingAuth) return;
    setCheckingAuth(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/profile?redirect=/checkout&message=Please sign in to purchase items.');
        return;
      }
      router.push('/checkout');
    } catch (err) {
      console.error('Checkout auth check error:', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-primary-cream py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 w-full">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-[10px] tracking-[0.25em] text-brand-primary uppercase font-bold">Your Selection</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-secondary mt-1">Shopping Bag</h1>
          <div className="mx-auto mt-4 h-0.5 w-12 bg-brand-primary" />
        </div>

        {items.length === 0 ? (
          /* Empty Cart State - Balanced & Centered */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-primary-light/10 bg-white py-20 px-6 text-center shadow-[0_12px_45px_rgba(181,131,141,0.06)] max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-brand-primary-cream flex items-center justify-center text-brand-primary/60 border border-brand-primary-light/10">
              <ShoppingBag size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-xl font-medium tracking-wide text-brand-secondary">Your bag is empty</h2>
              <p className="text-xs text-brand-secondary/50 max-w-xs leading-relaxed">
                Explore our curated collection of premium boutique clothing to find your perfect style.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-block rounded bg-brand-secondary px-8 py-3.5 text-xs font-bold tracking-[0.15em] text-white hover:bg-brand-primary transition duration-300 shadow-sm"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          /* Filled Cart State - Premium Grid */
          <div className="grid gap-8 lg:grid-cols-3 items-start animate-fade-in">
            {/* Items Column */}
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.size}-${item.color}`}
                  className="flex gap-4 rounded-xl border border-brand-primary-light/10 bg-white p-4 shadow-[0_6px_20px_rgba(181,131,141,0.02)] transition hover:shadow-md"
                >
                  {/* Item Image */}
                  <div className="h-24 w-18 sm:h-28 sm:w-22 flex-shrink-0 overflow-hidden rounded bg-brand-primary-cream border border-brand-primary-light/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url || '/placeholder.jpg'}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between gap-4">
                        <h3 className="font-serif text-base font-semibold text-brand-secondary line-clamp-1">{item.name}</h3>
                        <span className="font-bold text-brand-secondary text-sm">LKR {(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-brand-secondary/60 flex flex-wrap gap-2 items-center">
                        <span>Size: <span className="font-bold text-brand-secondary uppercase">{item.size}</span></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary-light/40" />
                        <span className="flex items-center gap-1">
                          Color: 
                          <span 
                            className="inline-block h-2.5 w-2.5 rounded-full border border-brand-primary-light/35"
                            style={{ backgroundColor: item.color.toLowerCase().includes('wash') || item.color.toLowerCase().includes('denim') ? '#8da9c4' : item.color.replace(/\s+/g, '').toLowerCase() }}
                          />
                          <span className="font-bold text-brand-secondary">{item.color}</span>
                        </span>
                      </p>
                    </div>

                    {/* Quantity Selector & Remove Button */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center rounded border border-brand-primary-light/30 bg-white h-9 shadow-sm">
                        <button
                          onClick={() => updateQty(item.product_id, item.size, item.color, item.qty - 1)}
                          className="p-2 text-brand-secondary/60 hover:text-brand-primary transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[1.75rem] text-center font-bold text-xs text-brand-secondary">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.product_id, item.size, item.color, item.qty + 1)}
                          className="p-2 text-brand-secondary/60 hover:text-brand-primary transition"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id, item.size, item.color)}
                        className="flex items-center gap-1 text-xs font-bold text-red-500/80 hover:text-red-700 transition"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Column */}
            <div className="rounded-xl border border-brand-primary-light/10 bg-white p-6 shadow-[0_8px_30px_rgba(181,131,141,0.04)] space-y-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-lg font-bold text-brand-secondary">Order Summary</h2>
              
              <div className="space-y-4 text-xs font-semibold text-brand-secondary/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-brand-secondary font-bold">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="italic">Calculated at checkout</span>
                </div>
                <hr className="border-brand-primary-light/10" />
                <div className="flex justify-between text-base font-bold text-brand-secondary">
                  <span>Total</span>
                  <span className="text-brand-primary">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <p className="text-[10px] text-brand-secondary/40 leading-relaxed">
                Island-wide delivery fee will be applied at checkout. Payments can be completed securely via Bank Transfer.
              </p>

              <button
                onClick={handleCheckout}
                disabled={checkingAuth}
                className="flex w-full items-center justify-center gap-2 rounded bg-brand-secondary py-4 text-xs font-bold tracking-[0.15em] text-white hover:bg-brand-primary transition duration-300 shadow-md disabled:opacity-60 cursor-pointer"
              >
                {checkingAuth ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    VERIFYING AUTH...
                  </>
                ) : (
                  <>
                    PROCEED TO CHECKOUT
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <Link
                href="/shop"
                className="block text-center text-xs font-bold text-brand-primary hover:text-brand-secondary transition tracking-wider"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
