'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient, createSession } from '@hazel/database';

export type LoginState = { error?: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: error?.message || 'Invalid credentials.' };
  }

  const adminClient = getSupabaseAdminClient();
  const session = await createSession(adminClient, data.user.id);

  if (session) {
    const cookieStore = await cookies();
    cookieStore.set('hz_session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60, // 30 minutes in seconds
    });
  } else {
    // If we fail to create the custom session, sign out of supabase auth to be safe
    await supabase.auth.signOut();
    return { error: 'Failed to create secure session.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
