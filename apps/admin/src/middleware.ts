import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SESSION_TIMEOUT_MINUTES = 30;
function getExpirationTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + SESSION_TIMEOUT_MINUTES);
  return date.toISOString();
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPath = request.nextUrl.pathname.startsWith('/login');
  const sessionId = request.cookies.get('hz_session_id')?.value;
  let customSessionValid = false;

  if (sessionId) {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    const now = new Date().toISOString();
    const { data: session } = await adminClient
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .gt('expires_at', now)
      .single();

    if (session) {
      const newExpiresAt = getExpirationTime();
      const { error } = await adminClient
        .from('sessions')
        .update({ expires_at: newExpiresAt })
        .eq('id', sessionId);
        
      if (!error) {
        customSessionValid = true;
        supabaseResponse.cookies.set('hz_session_id', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_TIMEOUT_MINUTES * 60,
        });
      }
    }
  }

  if ((!user || !customSessionValid) && !isLoginPath) {
    if (user) {
      await supabase.auth.signOut();
      supabaseResponse.cookies.delete('hz_session_id');
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && customSessionValid && isLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
