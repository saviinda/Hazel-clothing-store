'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../store/useCart';
import { Menu, X, ShoppingBag } from 'lucide-react';
import Logo from './Logo';

const NAV_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP', href: '/shop' },
  { label: 'ORDER TRACKING', href: '/track' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'CONTACT US', href: '/contact' },
];

function NavLink({
  href,
  label,
  onClick,
  className = '',
}: {
  href: string;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-3 transition-colors duration-300 hover:text-brand-primary ${
        active ? 'text-brand-primary font-bold' : ''
      } ${className}`}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const items = useCart((state) => state.items);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMenuOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [isMenuOpen]);

  const totalItemsCount = mounted ? items.reduce((total, item) => total + item.qty, 0) : 0;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-brand-primary-light/20 bg-brand-primary-cream/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:px-12">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo size="header" />
            <div className="hidden min-w-0 sm:flex flex-col leading-tight">
              <span className="font-serif text-lg font-bold tracking-wide text-brand-secondary truncate">HAZEL</span>
              <span className="text-[8px] tracking-[0.22em] text-brand-secondary/50 uppercase">Clothing Boutique</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-8 text-[11px] font-medium tracking-[0.2em] text-brand-secondary">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} className="py-0 whitespace-nowrap" />
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/cart"
              className="touch-target relative inline-flex items-center justify-center text-brand-secondary hover:text-brand-primary transition"
              aria-label="View Cart"
            >
              <ShoppingBag size={22} />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-white text-[10px] font-bold border-2 border-brand-primary-cream">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="touch-target inline-flex items-center justify-center text-brand-secondary hover:text-brand-primary lg:hidden"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-brand-primary-cream shadow-2xl animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b border-brand-primary-light/15 px-5">
              <span className="text-xs font-bold tracking-[0.2em] text-brand-secondary">MENU</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="touch-target inline-flex items-center justify-center text-brand-secondary"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4 text-sm font-semibold tracking-wider text-brand-secondary">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="border-t border-brand-primary-light/15 p-5">
              <Link
                href="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded bg-brand-secondary py-3.5 text-xs font-bold tracking-widest text-white"
              >
                <ShoppingBag size={16} />
                VIEW CART {totalItemsCount > 0 ? `(${totalItemsCount})` : ''}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
