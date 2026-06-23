'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, LogOut, ShoppingBag, Edit3, Eye, EyeOff, Loader2,
  ChevronRight, Package, ArrowLeft, CheckCircle, AlertCircle,
  Lock, Mail, Phone, MapPin, Home, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  signUpCustomer, signInCustomer, signOutCustomer, updateCustomerProfile
} from '../../lib/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Tab = 'orders' | 'edit' | 'security';
type AuthMode = 'signin' | 'signup';

const ORDER_STATUS_COLORS: Record<string, string> = {
  'Pending Payment':       'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Payment Verification':  'bg-blue-50 text-blue-800 border-blue-200',
  'Processing':            'bg-purple-50 text-purple-800 border-purple-200',
  'Packed':                'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Shipped':               'bg-cyan-50 text-cyan-800 border-cyan-200',
  'Delivered':             'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Completed':             'bg-green-50 text-green-800 border-green-200',
  'Cancelled':             'bg-red-50 text-red-800 border-red-200',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/* ─────────────── AUTH PANEL ─────────────── */
function AuthPanel({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [info, setInfo]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signInCustomer(email, password);
        if (err) throw err;
        onSuccess();
      } else {
        if (!name || !phone) { setError('Please fill in all fields.'); return; }
        const { data, error: err } = await signUpCustomer(email, password, name, phone);
        if (err) throw err;
        if (data?.user && !data.session) {
          setInfo('Account created! Please check your email to confirm your account.');
        } else {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full rounded-lg border border-brand-primary-light/30 bg-white px-4 py-3 text-sm
    text-brand-secondary placeholder-brand-secondary/40 outline-none
    focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition`;

  return (
    <div className="min-h-screen bg-brand-primary-cream flex items-center justify-center px-4 py-16 pb-32 lg:pb-16">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-serif text-3xl font-bold tracking-wider text-brand-secondary">HAZEL</span>
            <span className="block text-[9px] tracking-[0.3em] text-brand-secondary/40 uppercase mt-0.5">Clothing Boutique</span>
          </Link>
          <h1 className="font-serif text-2xl font-light text-brand-secondary mt-2">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs text-brand-secondary/50 mt-1 tracking-wide">
            {mode === 'signin'
              ? 'Sign in to view your orders and manage your profile.'
              : 'Join Hazel to shop and track your orders with ease.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-brand-primary-light/20 mb-6 bg-white shadow-sm">
          {(['signin', 'signup'] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setInfo(''); }}
              className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition ${
                mode === m
                  ? 'bg-brand-secondary text-white'
                  : 'text-brand-secondary/60 hover:text-brand-secondary'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-brand-primary-light/15 shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                  <input className={`${inputCls} pl-10`} type="text" placeholder="Full Name *"
                    value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                  <input className={`${inputCls} pl-10`} type="tel" placeholder="Phone Number *"
                    value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
              <input className={`${inputCls} pl-10`} type="email" placeholder="Email Address *"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
              <input className={`${inputCls} pl-10 pr-11`} type={showPw ? 'text' : 'password'}
                placeholder="Password *" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30 hover:text-brand-secondary transition">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                <input className={`${inputCls} pl-10`} type={showPw ? 'text' : 'password'}
                  placeholder="Confirm Password *" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-secondary py-3.5 text-xs font-bold tracking-widest text-white transition hover:bg-brand-primary disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Please wait...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {mode === 'signin' && (
            <p className="text-center text-xs text-brand-secondary/40 mt-4">
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }}
                className="text-brand-primary font-semibold hover:underline">
                Sign up
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-brand-secondary/30 mt-6">
          <Link href="/" className="hover:text-brand-primary transition flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─────────────── PROFILE DASHBOARD ─────────────── */
function ProfileDashboard({ user, onSignOut }: { user: SupabaseUser; onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Edit profile state
  const [editName, setEditName]         = useState(user.user_metadata?.name || '');
  const [editPhone, setEditPhone]       = useState(user.user_metadata?.phone || '');
  const [editStreet, setEditStreet]     = useState(user.user_metadata?.address?.street || '');
  const [editCity, setEditCity]         = useState(user.user_metadata?.address?.city || '');
  const [editPostal, setEditPostal]     = useState(user.user_metadata?.address?.postal_code || '');
  const [editLoading, setEditLoading]   = useState(false);
  const [editSuccess, setEditSuccess]   = useState(false);
  const [editError, setEditError]       = useState('');

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const userEmail = user.email;
      if (!userEmail) { setOrdersLoading(false); return; }
      // Find customer by email
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      if (!customerData) { setOrders([]); setOrdersLoading(false); return; }
      // Get their orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, order_status, payment_status, items, shipping_address, tracking_number')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });
      setOrders(orderData || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [user.email]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true); setEditSuccess(false); setEditError('');
    const { error: err } = await updateCustomerProfile({
      name: editName, phone: editPhone,
      address: { street: editStreet, city: editCity, postal_code: editPostal },
    });
    setEditLoading(false);
    if (err) { setEditError(err.message); }
    else { setEditSuccess(true); setTimeout(() => setEditSuccess(false), 3000); }
  };

  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Customer';

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'orders', label: 'My Orders', icon: <Package size={15} /> },
    { key: 'edit', label: 'Edit Profile', icon: <Edit3 size={15} /> },
  ];

  const inputCls = `w-full rounded-lg border border-brand-primary-light/30 bg-brand-primary-cream px-4 py-3 text-sm
    text-brand-secondary placeholder-brand-secondary/40 outline-none
    focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition`;

  return (
    <div className="min-h-screen bg-brand-primary-cream pb-32 lg:pb-12">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-secondary via-brand-secondary-light to-brand-secondary pt-12 pb-20 px-6">
        {/* Decorative rings */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full border border-white/5" />

        <div className="mx-auto max-w-3xl relative">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs mb-8 transition">
            <Home size={13} /> Home
          </Link>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative h-20 w-20 flex-shrink-0 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-xl border-4 border-white/20">
              <span className="font-serif text-2xl font-bold text-white">
                {getInitials(displayName)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-wide truncate">
                {displayName}
              </h1>
              <p className="text-white/50 text-xs mt-1 truncate">{user.email}</p>
              {user.user_metadata?.phone && (
                <p className="text-white/40 text-xs">{user.user_metadata.phone}</p>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={onSignOut}
            className="absolute top-0 right-0 flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold tracking-wider transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </div>

      {/* Content Card (overlaps header) */}
      <div className="mx-auto max-w-3xl px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-primary-light/10 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-brand-primary-light/15">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition border-b-2 ${
                  activeTab === t.key
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-brand-secondary/50 hover:text-brand-secondary'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-8">

            {/* ── ORDERS TAB ── */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-serif text-xl font-light text-brand-secondary">Order History</h2>
                  {orders.length > 0 && (
                    <span className="text-xs font-bold text-brand-secondary/40 tracking-wider">
                      {orders.length} order{orders.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {ordersLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-brand-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag size={40} className="text-brand-primary-light mx-auto" />
                    <p className="font-serif text-lg text-brand-secondary/50">No orders yet</p>
                    <p className="text-xs text-brand-secondary/30">Your orders will appear here after you shop.</p>
                    <Link href="/shop"
                      className="inline-flex items-center gap-2 mt-4 rounded-lg bg-brand-secondary text-white text-xs font-bold tracking-widest px-6 py-3 hover:bg-brand-primary transition">
                      SHOP NOW <ChevronRight size={14} />
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const statusColor = ORDER_STATUS_COLORS[order.order_status] || 'bg-gray-50 text-gray-700 border-gray-200';
                    const itemCount = Array.isArray(order.items)
                      ? order.items.reduce((s: number, i: any) => s + (i.qty || 1), 0)
                      : 0;
                    return (
                      <div key={order.id}
                        className="rounded-xl border border-brand-primary-light/15 overflow-hidden hover:border-brand-primary/30 transition group">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-brand-primary-cream/50">
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-[10px] font-bold tracking-widest text-brand-secondary/40 uppercase">Order ID</p>
                            <p className="font-mono text-xs text-brand-secondary font-semibold truncate">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${statusColor}`}>
                              {order.order_status}
                            </span>
                            {order.tracking_number && (
                              <Link href={`/track?id=${order.id}`}
                                className="text-[10px] font-bold tracking-wider text-brand-primary hover:underline flex items-center gap-1">
                                TRACK <ChevronRight size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                        {/* Order Details */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-brand-secondary/40 font-bold uppercase tracking-wider text-[9px] mb-0.5">Date</p>
                            <p className="text-brand-secondary font-semibold">{formatDate(order.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-brand-secondary/40 font-bold uppercase tracking-wider text-[9px] mb-0.5">Total</p>
                            <p className="text-brand-secondary font-bold">LKR {Number(order.total_amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-brand-secondary/40 font-bold uppercase tracking-wider text-[9px] mb-0.5">Items</p>
                            <p className="text-brand-secondary font-semibold">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {/* Item List */}
                        {Array.isArray(order.items) && order.items.length > 0 && (
                          <div className="px-4 pb-4 space-y-1.5">
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs text-brand-secondary/60">
                                <span className="truncate max-w-[70%]">{item.qty}× {item.name}</span>
                                <span className="font-semibold text-brand-secondary ml-2 flex-shrink-0">
                                  LKR {(item.price * item.qty).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-[10px] text-brand-secondary/40">+ {order.items.length - 3} more item(s)</p>
                            )}
                          </div>
                        )}
                        {/* Track Button */}
                        <div className="border-t border-brand-primary-light/10 px-4 py-3">
                          <Link href={`/track?id=${order.id}`}
                            className="text-[10px] font-bold tracking-widest text-brand-secondary/50 hover:text-brand-primary flex items-center gap-1 transition">
                            VIEW ORDER DETAILS <ChevronRight size={11} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── EDIT PROFILE TAB ── */}
            {activeTab === 'edit' && (
              <div>
                <h2 className="font-serif text-xl font-light text-brand-secondary mb-6">Edit Profile</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/50">Full Name</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                        <input className={`${inputCls} pl-10`} type="text" placeholder="Your name"
                          value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/50">Phone</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                        <input className={`${inputCls} pl-10`} type="tel" placeholder="07X XXXXXXX"
                          value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/50">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/30" />
                      <input className={`${inputCls} pl-10 opacity-50`} type="email"
                        value={user.email || ''} readOnly disabled />
                    </div>
                    <p className="text-[10px] text-brand-secondary/30">Email cannot be changed.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/50">
                      Delivery Address
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-3.5 text-brand-secondary/30" />
                      <input className={`${inputCls} pl-10`} type="text" placeholder="Street address"
                        value={editStreet} onChange={(e) => setEditStreet(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputCls} type="text" placeholder="City"
                        value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                      <input className={inputCls} type="text" placeholder="Postal code"
                        value={editPostal} onChange={(e) => setEditPostal(e.target.value)} />
                    </div>
                  </div>

                  {editError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      {editError}
                    </div>
                  )}
                  {editSuccess && (
                    <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                      <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                      Profile updated successfully!
                    </div>
                  )}

                  <button type="submit" disabled={editLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-secondary py-3.5 text-xs font-bold tracking-widest text-white hover:bg-brand-primary transition disabled:opacity-60">
                    {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {editLoading ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </form>

                {/* Sign Out Section */}
                <div className="mt-10 pt-6 border-t border-brand-primary-light/15">
                  <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-widest mb-3">Account</p>
                  <button
                    onClick={onSignOut}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-3.5 text-xs font-bold tracking-widest text-red-700 hover:bg-red-100 transition"
                  >
                    <LogOut size={14} /> SIGN OUT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PAGE ─────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser]       = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    await signOutCustomer();
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-primary-cream">
        <Loader2 size={36} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPanel onSuccess={() => {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }} />;
  }

  return <ProfileDashboard user={user} onSignOut={handleSignOut} />;
}
