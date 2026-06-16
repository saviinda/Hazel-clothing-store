import { SupabaseClient } from '@supabase/supabase-js';

const SESSION_TIMEOUT_MINUTES = 30;

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

/**
 * Calculates the expiration time from now
 */
function getExpirationTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + SESSION_TIMEOUT_MINUTES);
  return date.toISOString();
}

/**
 * Creates a new session in the database for the given user ID.
 */
export async function createSession(supabase: SupabaseClient, userId: string): Promise<Session | null> {
  const expires_at = getExpirationTime();

  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        user_id: userId,
        expires_at,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return data as Session;
}

/**
 * Validates a session and extends its expiration time if valid.
 * Returns the updated session or null if invalid/expired.
 */
export async function validateAndRenewSession(supabase: SupabaseClient, sessionId: string): Promise<Session | null> {
  const now = new Date().toISOString();

  // First, verify the session exists and hasn't expired
  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .gt('expires_at', now)
    .single();

  if (fetchError || !session) {
    // If expired or not found, we should probably delete it to clean up, but we can also rely on cron jobs.
    // For now, just return null.
    return null;
  }

  // Session is valid, slide the expiration window
  const newExpiresAt = getExpirationTime();

  const { data: updatedSession, error: updateError } = await supabase
    .from('sessions')
    .update({ expires_at: newExpiresAt })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error renewing session:', updateError);
    return null;
  }

  return updatedSession as Session;
}

/**
 * Destroys a specific session.
 */
export async function destroySession(supabase: SupabaseClient, sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error destroying session:', error);
    return false;
  }

  return true;
}

/**
 * Destroys all sessions for a specific user (Logout from all devices).
 */
export async function destroyAllUserSessions(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error destroying all user sessions:', error);
    return false;
  }

  return true;
}
