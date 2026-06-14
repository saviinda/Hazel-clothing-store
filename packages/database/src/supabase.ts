import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Default client for storefront or frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom helper to create client dynamically
export const getSupabaseClient = (url?: string, key?: string) => {
  return createClient(url || supabaseUrl, key || supabaseAnonKey);
};

// Admin helper (bypass RLS for server-side endpoints like auth settings or audit logging)
export const getSupabaseAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
