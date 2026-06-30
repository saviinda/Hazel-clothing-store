import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdminClient } from '@hazel/database';

export async function getCallerRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {}
            });
          },
        },
      }
    );

    // Use getSession() - reads JWT from the cookie locally without a network call
    const { data: { session } } = await client.auth.getSession();
    const user = session?.user;
    console.log('[getCallerRole] session user:', user?.email);
    if (!user) return null;

    // Map by known system account emails first (fast path, no DB needed)
    const email = user.email || '';
    if (email === 'superadmin@hazel.lk' || email === 'superadmin@hazel.com') {
      return 'Super Admin';
    } else if (email === 'admin@hazel.com') {
      return 'Admin';
    } else if (email === 'staff@hazel.com') {
      return 'Staff';
    }

    // For other users, look up role in public.users table via admin client (bypasses RLS)
    const adminClient = getSupabaseAdminClient();
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile?.role as string) || null;
    console.log('[getCallerRole] detected role from DB:', role);
    return role;
  } catch (err: any) {
    console.error('[getCallerRole] error:', err?.message);
    return null;
  }
}
