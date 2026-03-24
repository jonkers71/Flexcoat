import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/role
 * Returns the authenticated user's role from their user_metadata.
 * The role is set in the Supabase Dashboard under Authentication > Users
 * by updating the user's raw_user_meta_data with { "role": "admin" }.
 *
 * Returns:
 *   { role: "admin" | "user" }  on success
 *   401 if not authenticated
 */
export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
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

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (user.user_metadata?.role as string) || 'user';
  return NextResponse.json({ role });
}
