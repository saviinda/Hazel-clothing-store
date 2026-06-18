'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface HeroBannerProps {
  imageUrl: string;
  mobileImageUrls?: string[];
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

const SLIDE_INTERVAL_MS = 5000;

export default function HeroBanner({
  imageUrl,
  mobileImageUrls = [],
  title,
  subtitle,
  ctaText,
  ctaLink,
}: HeroBannerProps) {
  const mobileSlides =
    mobileImageUrls.length > 0 ? mobileImageUrls : [imageUrl];
  const hasMobileCarousel = mobileSlides.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + mobileSlides.length) % mobileSlides.length);
    },
    [mobileSlides.length]
  );

  const next = useCallback(() => {
    setActiveIndex(i => (i + 1) % mobileSlides.length);
  }, [mobileSlides.length]);

  const prev = useCallback(() => {
    setActiveIndex(i => (i - 1 + mobileSlides.length) % mobileSlides.length);
  }, [mobileSlides.length]);

  useEffect(() => {
    if (!hasMobileCarousel) return;
    const id = setInterval(next, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasMobileCarousel, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) next();
    else prev();
  };

  return (
    <section className="relative min-h-[70vh] sm:min-h-[85vh] w-full bg-brand-secondary overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-secondary/40 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 via-brand-secondary/30 to-brand-secondary/25 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(43,34,31,0.45)_0%,transparent_65%)] z-10 pointer-events-none" />

      {/* Desktop: single banner image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Hazel Clothing Hero"
        className="absolute hidden sm:block h-full w-full object-cover object-center z-0 scale-105 animate-[scale-up_20s_ease-out_infinite_alternate]"
      />

      {/* Mobile: carousel or single image */}
      <div
        className="absolute inset-0 z-0 sm:hidden"
        onTouchStart={hasMobileCarousel ? handleTouchStart : undefined}
        onTouchEnd={hasMobileCarousel ? handleTouchEnd : undefined}
      >
        {mobileSlides.map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${url}-${index}`}
            src={url}
            alt={`Hazel Clothing Hero ${index + 1}`}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-in-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {hasMobileCarousel && (
          <div className="absolute bottom-5 left-0 right-0 z-[5] flex justify-center gap-2">
            {mobileSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-6 bg-brand-primary-cream'
                    : 'w-2 bg-brand-primary-cream/45'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 md:px-12 max-w-4xl mx-auto w-full py-16 sm:py-20">
        <span className="font-serif text-brand-primary-light text-sm sm:text-lg md:text-xl tracking-[0.25em] mb-5 font-light uppercase [text-shadow:0_1px_12px_rgba(43,34,31,0.6)]">
          Hazel Boutique
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-wide text-brand-primary-cream leading-[1.15] max-w-3xl uppercase text-balance [text-shadow:0_2px_24px_rgba(43,34,31,0.75)]">
          {title}
        </h1>
        <p className="mt-6 sm:mt-7 text-brand-primary-cream/90 text-sm sm:text-base md:text-lg max-w-xl font-light tracking-wide leading-relaxed font-sans text-balance [text-shadow:0_1px_16px_rgba(43,34,31,0.65)]">
          {subtitle}
        </p>
        <div className="mt-9 sm:mt-11">
          <Link
            href={ctaLink}
            className="relative inline-flex items-center justify-center overflow-hidden border border-brand-primary bg-brand-primary p-3 px-8 sm:p-4 sm:px-12 text-[11px] font-bold tracking-[0.2em] text-white transition duration-500 rounded-sm group"
          >
            <span className="relative z-10">{ctaText}</span>
            <div className="absolute inset-0 bg-brand-secondary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 z-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}
