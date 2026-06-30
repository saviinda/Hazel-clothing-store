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
  // Bypass all middleware for API routes to prevent hanging
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const isLoginPath = request.nextUrl.pathname.startsWith('/login');
  const sessionId = request.cookies.get('hz_session_id')?.value;
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch';

  // 1. FAST PATH: Bypassing DB checks for prefetch requests if session cookie exists
  if (isPrefetch) {
    if (!sessionId && !isLoginPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next();




  // 2. THROTTLE PATH: Bypass database and auth api queries if verified recently (< 2 mins ago)
  const lastRenewStr = request.cookies.get('hz_session_last_renew')?.value;
  const now = new Date();
  let shouldRenewInDb = true;

  if (lastRenewStr && sessionId && !isLoginPath) {
    const lastRenew = new Date(lastRenewStr);
    const diffMs = now.getTime() - lastRenew.getTime();
    const diffMins = diffMs / (1000 * 60);
    if (diffMins < 2) {
      shouldRenewInDb = false;
    }
  }

  if (!shouldRenewInDb) {
    return supabaseResponse;
  }

  // 3. FULL PATH: Perform Supabase getUser and DB query/update
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

  let customSessionValid = false;

  if (sessionId && user) {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const nowStr = now.toISOString();
    const { data: session } = await adminClient
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .gt('expires_at', nowStr)
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

        supabaseResponse.cookies.set('hz_session_last_renew', now.toISOString(), {
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
    }
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.cookies.delete('hz_session_id');
    redirectResponse.cookies.delete('hz_session_last_renew');
    return redirectResponse;
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
