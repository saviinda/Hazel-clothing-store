'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailBody = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      '',
      form.message,
    ].join('\n');

    const mailto = `mailto:hello@hazelclothing.lk?subject=${encodeURIComponent(form.subject || 'Website Enquiry')}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = mailto;
    setSubmitted(true);
  };

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
                <a href="tel:+94771234567" className="hover:text-brand-primary transition">
                  +94 77 123 4567
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-brand-primary" />
                <a href="mailto:hello@hazelclothing.lk" className="hover:text-brand-primary transition">
                  hello@hazelclothing.lk
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
              href="https://wa.me/94771234567"
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
                href="https://instagram.com/hazelclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-secondary transition"
              >
                Instagram
              </a>
              <span className="text-brand-primary-light">|</span>
              <a
                href="https://tiktok.com/@hazelclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-secondary transition"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {submitted ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 py-16 text-center">
              <CheckCircle2 size={48} className="mb-4 text-green-600" />
              <h2 className="font-serif text-2xl font-bold text-brand-secondary">Message Ready!</h2>
              <p className="mt-2 max-w-sm text-sm text-brand-secondary/65">
                Your email app should open with your message. If it didn&apos;t, email us at hello@hazelclothing.lk
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-medium text-brand-primary hover:text-brand-secondary"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-lg border border-brand-primary-light/15 bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="font-serif text-xl font-bold text-brand-secondary">Send a Message</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-brand-secondary/60">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded border border-brand-primary-light/30 bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-brand-secondary/60">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded border border-brand-primary-light/30 bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-brand-secondary/60">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded border border-brand-primary-light/30 bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary"
                    placeholder="07X XXX XXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-brand-secondary/60">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded border border-brand-primary-light/30 bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary"
                    placeholder="Order enquiry, sizing help..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-brand-secondary/60">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none rounded border border-brand-primary-light/30 bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded bg-brand-secondary py-4 text-sm font-bold tracking-widest text-white hover:bg-brand-primary transition sm:w-auto sm:px-10"
              >
                <Send size={16} />
                SEND MESSAGE
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
