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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone, role: 'customer' },
    },
  });
  return { data, error };
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
