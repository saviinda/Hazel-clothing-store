'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseAdminClient, destroySession, destroyAllUserSessions } from '@hazel/database';
import { createClient } from '@/lib/supabase/server';

export async function logoutAction() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('hz_session_id')?.value;
  
  if (sessionId) {
    const adminClient = getSupabaseAdminClient();
    await destroySession(adminClient, sessionId);
    cookieStore.delete('hz_session_id');
  }
  cookieStore.delete('hz_session_last_renew');

  // Also sign out of Supabase to clear its cookies
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect('/login');
}

export async function logoutAllDevicesAction(userId: string) {
  const adminClient = getSupabaseAdminClient();
  await destroyAllUserSessions(adminClient, userId);
  
  // This will only clear the DB sessions. 
  // The user's current device will be logged out on the next request 
  // because the middleware won't find the session in the DB.
  // We can also sign them out of the current device immediately:
  
  const cookieStore = await cookies();
  cookieStore.delete('hz_session_id');
  cookieStore.delete('hz_session_last_renew');
  
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  redirect('/login');
}
