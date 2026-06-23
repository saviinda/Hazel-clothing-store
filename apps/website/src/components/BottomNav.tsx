'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../store/useCart';
import { Home, ShoppingBag, ShoppingCart, Info } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const items = useCart((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);



  const totalItemsCount = mounted ? items.reduce((total, item) => total + item.qty, 0) : 0;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: totalItemsCount },
    { label: 'About Us', href: '/about', icon: Info },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-primary-cream/95 backdrop-blur-md border-t border-brand-primary-light/20 lg:hidden pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors duration-300 relative ${
                isActive ? 'text-brand-primary' : 'text-brand-secondary/70 hover:text-brand-primary'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-accent text-white text-[9px] font-bold border border-brand-primary-cream">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
