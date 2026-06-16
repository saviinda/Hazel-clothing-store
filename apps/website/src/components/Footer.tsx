import React from 'react';
import Link from 'next/link';
import Logo from './Logo';

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Cart', href: '/cart' },
  { label: 'Order Tracking', href: '/track' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-brand-secondary text-brand-primary-cream border-t border-brand-primary/10">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="space-y-4">
            <Logo size="footer" href="/" variant="dark" />
            <p className="text-sm leading-6 text-brand-primary-cream/60">
              Modern silhouettes, feminine tones, and trendy styles tailored for young Sri Lankan women.
              Follow us on Instagram & TikTok for daily fits!
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-wider text-brand-primary-light uppercase mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm text-brand-primary-cream/70">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-primary-light transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-wider text-brand-primary-light uppercase mb-6">
              Get In Touch
            </h4>
            <p className="text-sm text-brand-primary-cream/70 leading-6">
              Colombo, Sri Lanka<br />
              WhatsApp: +94 77 123 4567<br />
              Email: hello@hazelclothing.lk
            </p>
            <div className="flex space-x-4 mt-6 text-sm">
              <a
                href="https://instagram.com/hazelclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary-cream/60 hover:text-brand-primary-light transition"
              >
                Instagram
              </a>
              <span className="text-brand-primary-cream/20">|</span>
              <a
                href="https://tiktok.com/@hazelclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary-cream/60 hover:text-brand-primary-light transition"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        <hr className="border-brand-primary-cream/10 my-12" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-brand-primary-cream/45">
          <p>© {new Date().getFullYear()} Hazel Clothing Boutique. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Bank Transfer Payments</span>
            <span>•</span>
            <span>Island-wide Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
