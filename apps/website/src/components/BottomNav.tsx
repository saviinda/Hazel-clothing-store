'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../store/useCart';
import { Home, ShoppingBag, ShoppingCart, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BottomNav() {
  const pathname = usePathname();
  const items = useCart((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const totalItemsCount = mounted ? items.reduce((total, item) => total + item.qty, 0) : 0;
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0];
  const initials = mounted && displayName ? getInitials(displayName) : null;

  const navItems = [
    { label: 'Home', href: '/', icon: <Home size={20} /> },
    { label: 'Shop', href: '/shop', icon: <ShoppingBag size={20} /> },
    {
      label: 'Cart',
      href: '/cart',
      icon: (
        <div className="relative">
          <ShoppingCart size={20} />
          {totalItemsCount > 0 && (
            <span className="absolute -top-2 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-white text-[9px] font-bold border border-brand-primary-cream">
              {totalItemsCount}
            </span>
          )}
        </div>
      ),
    },
    {
      label: mounted && user ? 'Profile' : 'Sign In',
      href: '/profile',
      icon: initials ? (
        <span className="h-[22px] w-[22px] rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-[10px] font-bold">
          {initials}
        </span>
      ) : (
        <UserCircle size={20} />
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-primary-cream/95 backdrop-blur-md border-t border-brand-primary-light/20 lg:hidden pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors duration-300 relative ${
                isActive ? 'text-brand-primary' : 'text-brand-secondary/70 hover:text-brand-primary'
              }`}
            >
              <div className={`flex items-center justify-center ${isActive ? '[&_svg]:stroke-[2.5px]' : '[&_svg]:stroke-[1.8px]'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
