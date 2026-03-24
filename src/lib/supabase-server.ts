/**
 * Server-side Supabase client factory.
 *
 * Use this ONLY in:
 *  - API Route Handlers (app/api/ route.ts files)
 *  - Server Components (no 'use client' directive)
 *
 * This file imports 'next/headers' which is NOT available in Client Components.
 * For Client Components, import from '@/lib/supabase' instead.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
