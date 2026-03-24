/**
 * Browser-side Supabase client.
 *
 * Use this ONLY in Client Components ('use client') for:
 *  - Supabase Auth browser flows (signIn, signOut)
 *  - Storage uploads from the browser
 *
 * For API Routes and Server Components, import from '@/lib/supabase-server'.
 */

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);
