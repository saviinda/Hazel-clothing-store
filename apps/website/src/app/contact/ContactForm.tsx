'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function ContactForm({ ownerEmail }: { ownerEmail: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
          ownerEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message. Please try again.');
      }

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 py-16 text-center">
        <CheckCircle2 size={48} className="mb-4 text-green-600" />
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Message Sent!</h2>
        <p className="mt-2 max-w-sm text-sm text-brand-secondary/65">
          Thank you! Your message has been sent successfully. We will get back to you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-medium text-brand-primary hover:text-brand-secondary"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
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

      {error && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded bg-brand-secondary py-4 text-sm font-bold tracking-widest text-white hover:bg-brand-primary transition disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-10"
      >
        <Send size={16} />
        {loading ? 'SENDING...' : 'SEND MESSAGE'}
      </button>
    </form>
  );
}
