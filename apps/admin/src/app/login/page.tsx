'use client';

import React, { useActionState } from 'react';
import Image from 'next/image';
import { Loader2, Lock, Mail } from 'lucide-react';
import { loginAction, type LoginState } from './actions';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-primary-cream px-6">
      <div className="w-full max-w-md bg-white border border-brand-primary-light/20 p-8 rounded shadow-lg space-y-8 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.png" alt="Hazel Clothing Boutique" width={200} height={72} className="h-16 w-auto object-contain" priority />
          <span className="text-[10px] tracking-[0.25em] text-brand-primary uppercase mt-3">ADMIN PORTAL</span>
        </div>

        {state?.error && (
          <div className="p-3 text-xs bg-red-50 text-red-800 border border-red-200 rounded font-semibold">
            ⚠ {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-secondary/70 uppercase">Email Address</label>
            <div className="flex items-center border border-brand-primary-light/35 rounded bg-white p-3 text-sm focus-within:border-brand-primary">
              <Mail size={16} className="text-brand-secondary/40 mr-2" />
              <input
                type="email"
                name="email"
                required
                placeholder="superadmin@hazel.lk"
                className="w-full outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-secondary/70 uppercase">Password</label>
            <div className="flex items-center border border-brand-primary-light/35 rounded bg-white p-3 text-sm focus-within:border-brand-primary">
              <Lock size={16} className="text-brand-secondary/40 mr-2" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full outline-none bg-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 flex items-center justify-center gap-2 rounded bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest transition disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                LOGGING IN...
              </>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
