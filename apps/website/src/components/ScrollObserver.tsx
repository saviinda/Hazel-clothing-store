'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Intersection observer configuration
    const observerOptions = {
      root: null, // relative to the viewport
      rootMargin: '0px 0px -8% 0px', // trigger slightly before entering fully
      threshold: 0.05, // trigger when 5% of the element is visible
    };

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Once animated, stop observing this element
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(callback, observerOptions);

    // Grab all elements to animate
    const animElements = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );

    animElements.forEach((el) => {
      // If element is already below viewport/not active, observe it.
      // If it is already active, don't observe.
      if (!el.classList.contains('active')) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]); // run whenever path changes to capture new elements on navigated pages

  return null;
}
