'use client';

import { supabase } from './supabase';

export async function getCustomerSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCustomerUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUpCustomer(
  email: string,
  password: string,
  name: string,
  phone: string
) {
  try {
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone }),
    });
    const data = await res.json();
    if (!data.success) {
      return { data: null, error: { message: data.error || 'Failed to sign up' } };
    }
    return { data: data.data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Failed to sign up' } };
  }
}

export async function signInCustomer(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOutCustomer() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function updateCustomerProfile(updates: {
  name?: string;
  phone?: string;
  address?: { street?: string; city?: string; postal_code?: string };
}) {
  const { data, error } = await supabase.auth.updateUser({ data: updates });
  return { data, error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function verifySignUpOtp(email: string, token: string) {
  try {
    const res = await fetch('/api/v1/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();
    if (!data.success) {
      return { data: null, error: { message: data.error || 'Verification failed' } };
    }
    return { data: data.data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Verification failed' } };
  }
}

export async function resendSignUpOtp(email: string) {
  try {
    const res = await fetch('/api/v1/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.success) {
      return { data: null, error: { message: data.error || 'Failed to resend verification code' } };
    }
    return { data: data.data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Failed to resend verification code' } };
  }
}
