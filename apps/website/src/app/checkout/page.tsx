'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../store/useCart';
import { ShieldCheck, Upload, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Upload/Submit State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center space-y-6">
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Your bag is empty</h2>
        <p className="text-sm text-brand-secondary/60">Add items to your bag before proceeding to checkout.</p>
        <Link href="/cart" className="inline-block rounded bg-brand-primary p-3 px-8 text-sm font-bold text-white hover:bg-brand-secondary">
          VIEW CART
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryFee = 350; // flat rate for Sri Lanka
  const total = subtotal + deliveryFee;

  // Handle image upload to Cloudinary using signed upload parameters
  const handleReceiptUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg('');
    try {
      // 1. Call Next.js API to get signed signature
      const signRes = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'hazel-clothing/payment-proofs' }),
      });

      if (!signRes.ok) {
        throw new Error('Failed to get upload signature from server.');
      }

      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      // 2. Post file directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', 'hazel-clothing/payment-proofs');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error?.message || 'Cloudinary upload failed.');
      }

      const uploadData = await uploadRes.json();
      setReceiptUrl(uploadData.secure_url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error uploading receipt image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      handleReceiptUpload(file);
    }
  };

  // Submit checkout
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name || !phone || !street || !city || !postalCode) {
      setErrorMsg('Please fill in all required shipping and contact details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const orderPayload = {
        name,
        email,
        phone,
        street,
        city,
        postal_code: postalCode,
        payment_method: 'Bank Transfer',
        payment_proof_url: receiptUrl,
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          size: item.size,
          color: item.color,
          image_url: item.image_url
        })),
        total_amount: total,
      };

      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to submit order.');
      }

      // Clear Cart state
      clearCart();
      
      // Redirect to success confirmation
      router.push(`/track?id=${resData.data.id}&placed=true`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during order submission.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 w-full">
      <div className="mb-8">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary/60 hover:text-brand-primary">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Forms */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          {/* Shipping & Contact Address */}
          <div className="space-y-6 bg-white p-8 border border-brand-primary-light/10 rounded shadow-sm">
            <h3 className="font-serif text-xl font-bold text-brand-secondary">Shipping & Contact Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Minoli Perera"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0771234567"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-secondary/70 uppercase">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="minoli@gmail.com"
                className="w-full rounded border border-brand-primary-light/35 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-secondary/70 uppercase">Delivery Address *</label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="45 Galle Road, Apartment 3B"
                className="w-full rounded border border-brand-primary-light/35 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none mb-3"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Colombo 03"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00300"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method: Bank Transfer */}
          <div className="space-y-6 bg-white p-8 border border-brand-primary-light/10 rounded shadow-sm">
            <h3 className="font-serif text-xl font-bold text-brand-secondary">Payment Method</h3>
            
            <div className="p-4 border border-brand-primary rounded bg-brand-primary-cream/25">
              <span className="font-bold text-sm text-brand-secondary block">Bank Transfer (Offline Payment)</span>
              <p className="text-xs text-brand-secondary/60 mt-1">Please transfer the total amount to the account below and upload a screenshot of your transfer confirmation receipt.</p>
            </div>

            {/* Bank details panel */}
            <div className="p-5 bg-brand-primary-cream border border-brand-primary-light/15 rounded space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-secondary/60">Bank Name</span>
                <span className="font-bold text-brand-secondary">Commercial Bank of Ceylon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-secondary/60">Branch</span>
                <span className="font-bold text-brand-secondary">Colombo 03</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-secondary/60">Account Holder</span>
                <span className="font-bold text-brand-secondary">Hazel Clothing (PVT) Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-secondary/60">Account Number</span>
                <span className="font-bold text-brand-secondary">1000987654</span>
              </div>
            </div>

            {/* Receipt Upload Widget */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Upload Payment receipt (Optional now, can do on tracking page)</label>
              
              <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-brand-primary-light/40 rounded p-6 bg-gray-50 hover:bg-gray-100/50 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="text-brand-primary mb-2" size={24} />
                {isUploading ? (
                  <span className="flex items-center gap-2 text-xs font-semibold text-brand-secondary/75">
                    <Loader2 className="animate-spin text-brand-primary" size={14} />
                    Uploading receipt to Cloudinary...
                  </span>
                ) : receiptUrl ? (
                  <span className="text-xs font-bold text-green-700">✓ Receipt Uploaded Successfully!</span>
                ) : receiptFile ? (
                  <span className="text-xs font-semibold text-brand-secondary/75">{receiptFile.name} Selected</span>
                ) : (
                  <span className="text-xs font-semibold text-brand-secondary/60">Click or Drag Image to upload receipt (JPG/PNG)</span>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Order Summary</h3>

            {/* Items summary */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex justify-between gap-4 text-sm">
                  <div className="flex gap-3">
                    <span className="font-bold text-brand-primary bg-brand-primary-light/10 h-6 w-6 rounded flex items-center justify-center text-xs flex-shrink-0">{item.qty}x</span>
                    <div>
                      <h5 className="font-semibold text-brand-secondary">{item.name}</h5>
                      <span className="text-xs text-brand-secondary/50">Size: {item.size} | Color: {item.color}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-brand-secondary">LKR {item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <hr className="border-brand-primary-light/15" />

            {/* Calculations */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-brand-secondary/65">
                <span>Subtotal</span>
                <span>LKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-secondary/65">
                <span>Island-wide Delivery</span>
                <span>LKR {deliveryFee.toFixed(2)}</span>
              </div>
              <hr className="border-brand-primary-light/10" />
              <div className="flex justify-between text-base font-bold text-brand-secondary">
                <span>Total Amount</span>
                <span>LKR {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded font-semibold">
                ⚠ {errorMsg}
              </div>
            )}

            {/* Place Order Trigger */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className={`w-full flex items-center justify-center gap-2 rounded h-14 text-sm font-bold tracking-widest text-white transition ${
                isSubmitting || isUploading
                  ? 'bg-brand-secondary/40 cursor-not-allowed'
                  : 'bg-brand-secondary hover:bg-brand-primary'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  PLACING ORDER...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  PLACE ORDER
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-brand-secondary/40 leading-relaxed">
              By clicking "Place Order", you agree to pay the total amount via Bank Transfer and upload proof within 24 hours. Your stock reservation is held for 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
