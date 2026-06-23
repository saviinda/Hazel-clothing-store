'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../store/useCart';
import { Menu, X, ShoppingBag, UserCircle } from 'lucide-react';
import Logo from './Logo';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP', href: '/shop' },
  { label: 'ORDER TRACKING', href: '/track' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'CONTACT US', href: '/contact' },
];

const MOBILE_NAV_LINKS = [
  { label: 'HOME', href: '/' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'ORDER TRACKING', href: '/track' },
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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Header() {
  const items = useCart((state) => state.items);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMenuOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [isMenuOpen]);

  const totalItemsCount = mounted ? items.reduce((total, item) => total + item.qty, 0) : 0;
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0];
  const initials = displayName ? getInitials(displayName) : null;

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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[11px] font-medium tracking-[0.12em] text-brand-secondary">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} className="py-0 whitespace-nowrap" />
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Cart */}
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

            {/* Profile (desktop) */}
            <Link
              href="/profile"
              className="hidden lg:inline-flex touch-target items-center justify-center text-brand-secondary hover:text-brand-primary transition"
              aria-label="Profile"
            >
              {mounted && initials ? (
                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                  {initials}
                </span>
              ) : (
                <UserCircle size={22} />
              )}
            </Link>

            {/* Mobile menu toggle */}
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

      {/* Mobile Side Drawer */}
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
              {MOBILE_NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}
              {/* Profile Link in drawer */}
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 py-3 transition-colors duration-300 hover:text-brand-primary"
              >
                {mounted && initials ? (
                  <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-[9px] font-bold">
                    {initials}
                  </span>
                ) : (
                  <UserCircle size={16} />
                )}
                {mounted && user ? 'MY PROFILE' : 'SIGN IN'}
              </Link>
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
