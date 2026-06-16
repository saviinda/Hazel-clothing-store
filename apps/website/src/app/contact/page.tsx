import React from 'react';
import { supabase } from '@hazel/database';
import ContactForm from './ContactForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const revalidate = 30; // Reflect admin changes within 30 seconds

export default async function ContactPage() {
  // Fetch contact info from content table
  let contactInfo = {
    email: 'hello@hazelclothing.lk',
    whatsapp: '94771234567',
    instagram: 'https://instagram.com/hazelclothing',
    tiktok: 'https://tiktok.com/@hazelclothing',
  };

  try {
    const { data } = await supabase
      .from('content')
      .select('data')
      .eq('section_key', 'contact_info')
      .maybeSingle();

    if (data?.data) {
      contactInfo = {
        email: data.data.email || contactInfo.email,
        whatsapp: data.data.whatsapp || contactInfo.whatsapp,
        instagram: data.data.instagram || contactInfo.instagram,
        tiktok: data.data.tiktok || contactInfo.tiktok,
      };
    }
  } catch (err) {
    console.error('Contact info fetch error:', err);
  }

  const whatsappLink = `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`;
  const displayPhone = contactInfo.whatsapp.startsWith('94')
    ? `+${contactInfo.whatsapp.slice(0, 2)} ${contactInfo.whatsapp.slice(2, 4)} ${contactInfo.whatsapp.slice(4, 7)} ${contactInfo.whatsapp.slice(7)}`
    : `+${contactInfo.whatsapp}`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl font-bold text-brand-secondary md:text-4xl">Contact Us</h1>
        <div className="mx-auto mt-4 h-0.5 w-16 bg-brand-primary" />
        <p className="mx-auto mt-4 max-w-xl text-sm text-brand-secondary/65">
          Have a question about your order, sizing, or our collection? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        {/* Left sidebar — contact details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-brand-primary-light/15 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-brand-secondary">Get In Touch</h2>
            <ul className="mt-6 space-y-5 text-sm text-brand-secondary/75">
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-primary" />
                <span>Colombo, Sri Lanka</span>
              </li>
              <li className="flex gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-brand-primary" />
                <a href={whatsappLink} className="hover:text-brand-primary transition">
                  {displayPhone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-brand-primary" />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-brand-primary transition">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-brand-primary" />
                <span>Mon – Sat: 9:00 AM – 6:00 PM</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-brand-primary-light/15 bg-brand-secondary p-6 text-brand-primary-cream shadow-sm">
            <h3 className="font-semibold">Order via WhatsApp</h3>
            <p className="mt-2 text-sm text-brand-primary-cream/70">
              Prefer to chat? Message us directly for styling advice or order help.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded bg-brand-primary px-6 py-2.5 text-sm font-bold tracking-wider text-white hover:bg-brand-primary-light hover:text-brand-secondary transition"
            >
              CHAT ON WHATSAPP
            </a>
          </div>

          <div className="rounded-lg border border-brand-primary-light/15 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-brand-secondary">Follow Us</h3>
            <div className="mt-3 flex gap-4 text-sm">
              <a
                href={contactInfo.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-secondary transition"
              >
                Instagram
              </a>
              <span className="text-brand-primary-light">|</span>
              <a
                href={contactInfo.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-secondary transition"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        {/* Right — contact form (client component) */}
        <div className="lg:col-span-3">
          <ContactForm ownerEmail={contactInfo.email} />
        </div>
      </div>
    </div>
  );
}
