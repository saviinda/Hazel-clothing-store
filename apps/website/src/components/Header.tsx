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
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`whitespace-nowrap transition hover:text-brand-primary ${
        active ? 'text-brand-primary font-semibold' : ''
      }`}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const { getTotalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItemsCount = mounted ? getTotalItems() : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-primary-light/20 bg-brand-primary-cream/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-12">
        
        {/* Left: Logo */}
        <div className="flex items-center">
          <Logo size="header" />
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs xl:text-sm font-medium tracking-wider text-brand-secondary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
            />
          ))}
        </nav>

        {/* Right: Cart + Mobile Menu */}
        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative p-2 text-brand-secondary hover:text-brand-primary transition"
            aria-label="View Cart"
          >
            <ShoppingBag size={24} />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-white text-[10px] font-bold">
                {totalItemsCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-brand-secondary hover:text-brand-primary lg:hidden"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-brand-primary-light/10 bg-brand-primary-cream/95 py-6 px-6 lg:hidden">
          <nav className="flex flex-col space-y-4 text-sm font-semibold tracking-wider text-brand-secondary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}