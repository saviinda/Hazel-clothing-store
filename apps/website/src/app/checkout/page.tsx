'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../store/useCart';
import { ShieldCheck, Upload, Loader2, ArrowLeft, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@hazel/database';
import { supabase as browserSupabase } from '../../lib/supabase';

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

  // Dynamic Store Settings State
  const [deliveryFee, setDeliveryFee] = useState(350);
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Commercial Bank of Ceylon',
    bankBranch: 'Colombo 03',
    accountHolder: 'Hazel Clothing (PVT) Ltd',
    accountNumber: '1000987654'
  });

  useEffect(() => {
    setMounted(true);

    async function init() {
      try {
        // 1. Auto-fill from signed-in customer profile
        const { data: authData } = await browserSupabase.auth.getUser();
        if (authData?.user) {
          const meta = authData.user.user_metadata || {};
          if (meta.name)  setName(meta.name);
          if (authData.user.email) setEmail(authData.user.email);
          if (meta.phone) setPhone(meta.phone);
          if (meta.address) {
            if (meta.address.street)      setStreet(meta.address.street);
            if (meta.address.city)        setCity(meta.address.city);
            if (meta.address.postal_code) setPostalCode(meta.address.postal_code);
          }
        }

        // 2. Fetch delivery fee
        const { data: delData } = await supabase
          .from('content')
          .select('data')
          .eq('section_key', 'delivery_settings')
          .maybeSingle();

        if (delData && delData.data && typeof delData.data.delivery_fee === 'number') {
          setDeliveryFee(delData.data.delivery_fee);
        }

        // 3. Fetch bank details
        const { data: bankData } = await supabase
          .from('content')
          .select('data')
          .eq('section_key', 'bank_details')
          .maybeSingle();

        if (bankData && bankData.data) {
          setBankDetails({
            bankName: bankData.data.bank_name || 'Commercial Bank of Ceylon',
            bankBranch: bankData.data.bank_branch || 'Colombo 03',
            accountHolder: bankData.data.account_holder || 'Hazel Clothing (PVT) Ltd',
            accountNumber: bankData.data.account_number || '1000987654'
          });
        }
      } catch (err) {
        console.error('Failed to initialise checkout:', err);
      }
    }

    init();
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

    if (!name || !email || !phone || !street || !city || !postalCode) {
      setErrorMsg('Please fill in all required shipping, email, and contact details.');
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 md:px-12 w-full">
      <div className="mb-6">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary/60 hover:text-brand-primary">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-28 lg:pb-0">
        {/* Order Summary — shown first on mobile */}
        <div className="lg:col-span-5 order-first lg:order-last">
          <div className="bg-white p-5 sm:p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6 lg:sticky lg:top-24">
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Order Summary</h3>

            <div className="space-y-4 max-h-48 sm:max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex justify-between gap-3 text-sm">
                  <div className="flex gap-3 min-w-0">
                    <span className="font-bold text-brand-primary bg-brand-primary-light/10 h-6 w-6 rounded flex items-center justify-center text-xs flex-shrink-0">{item.qty}x</span>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-brand-secondary truncate">{item.name}</h5>
                      <span className="text-xs text-brand-secondary/50">Size: {item.size} | Color: {item.color}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-brand-secondary shrink-0">LKR {item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <hr className="border-brand-primary-light/15" />

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

            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded font-semibold">
                ⚠ {errorMsg}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className={`hidden lg:flex w-full items-center justify-center gap-2 rounded h-14 text-sm font-bold tracking-widest text-white transition ${
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

            <p className="hidden lg:block text-[10px] text-center text-brand-secondary/40 leading-relaxed">
              By clicking &quot;Place Order&quot;, you agree to pay the total amount via Bank Transfer and upload proof within 24 hours.
            </p>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 order-last lg:order-first space-y-6 sm:space-y-8">
          <div className="space-y-5 bg-white p-5 sm:p-8 border border-brand-primary-light/10 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-brand-secondary">Shipping &amp; Contact Details</h3>
              <Link href="/profile" className="flex items-center gap-1.5 text-xs text-brand-primary hover:underline font-semibold">
                <UserCircle size={14} />
                My Profile
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Minoli Perera"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-base sm:text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
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
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-base sm:text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-secondary/70 uppercase">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="minoli@gmail.com"
                className="w-full rounded border border-brand-primary-light/35 p-3 text-base sm:text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
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
                className="w-full rounded border border-brand-primary-light/35 p-3 text-base sm:text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none mb-3"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Colombo 03"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-base sm:text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00300"
                  className="w-full rounded border border-brand-primary-light/35 p-3 text-base sm:text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-white p-5 sm:p-8 border border-brand-primary-light/10 rounded shadow-sm">
            <h3 className="font-serif text-xl font-bold text-brand-secondary">Payment Method</h3>
            
            <div className="p-4 border border-brand-primary rounded bg-brand-primary-cream/25">
              <span className="font-bold text-sm text-brand-secondary block">Bank Transfer (Offline Payment)</span>
              <p className="text-xs text-brand-secondary/60 mt-1">Please transfer the total amount to the account below and upload a screenshot of your transfer confirmation receipt.</p>
            </div>

            <div className="p-4 sm:p-5 bg-brand-primary-cream border border-brand-primary-light/15 rounded space-y-3 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-brand-secondary/60 shrink-0">Bank Name</span>
                <span className="font-bold text-brand-secondary sm:text-right break-words">{bankDetails.bankName}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-brand-secondary/60 shrink-0">Branch</span>
                <span className="font-bold text-brand-secondary sm:text-right">{bankDetails.bankBranch}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-brand-secondary/60 shrink-0">Account Holder</span>
                <span className="font-bold text-brand-secondary sm:text-right break-words">{bankDetails.accountHolder}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-brand-secondary/60 shrink-0">Account Number</span>
                <span className="font-bold text-brand-secondary sm:text-right">{bankDetails.accountNumber}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Upload Payment receipt (Optional now, can do on tracking page)</label>
              
              <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-brand-primary-light/40 rounded p-6 bg-gray-50 hover:bg-gray-100/50 cursor-pointer min-h-[120px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="text-brand-primary mb-2" size={24} />
                {isUploading ? (
                  <span className="flex items-center gap-2 text-xs font-semibold text-brand-secondary/75 text-center px-2">
                    <Loader2 className="animate-spin text-brand-primary" size={14} />
                    Uploading receipt to Cloudinary...
                  </span>
                ) : receiptUrl ? (
                  <span className="text-xs font-bold text-green-700">✓ Receipt Uploaded Successfully!</span>
                ) : receiptFile ? (
                  <span className="text-xs font-semibold text-brand-secondary/75 text-center px-2">{receiptFile.name} Selected</span>
                ) : (
                  <span className="text-xs font-semibold text-brand-secondary/60 text-center px-2">Tap to upload receipt (JPG/PNG)</span>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-primary-light/20 bg-white/95 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">Total</p>
            <p className="font-serif text-lg font-bold text-brand-secondary">LKR {total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className={`touch-target flex shrink-0 items-center justify-center gap-2 rounded px-6 text-sm font-bold tracking-wider text-white transition ${
              isSubmitting || isUploading
                ? 'bg-brand-secondary/40 cursor-not-allowed'
                : 'bg-brand-secondary hover:bg-brand-primary'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                PLACING...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                PLACE ORDER
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
