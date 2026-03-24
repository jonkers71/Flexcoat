/**
 * Supabase client helpers.
 *
 * Two clients are exported:
 *
 * 1. `supabase` — a browser-side client using the public anon key.
 *    Use this ONLY in Client Components for reading public data or
 *    for Supabase Auth browser flows (signIn, signOut).
 *
 * 2. `createSupabaseServerClient()` — a server-side client that reads
 *    the user's session from HTTP cookies.  Use this in API Route Handlers
 *    and Server Components to make authenticated requests on behalf of the
 *    logged-in user.  RLS policies will be evaluated against their session.
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ── Browser client (Client Components only) ─────────────────────────────────
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Server client factory (API Routes & Server Components) ───────────────────
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
