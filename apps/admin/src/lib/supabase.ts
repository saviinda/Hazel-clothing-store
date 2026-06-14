import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from '@/lib/config';

export const supabase = createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
