import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { JobSchema } from '@/lib/schema';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

// ── Auth guard helper ────────────────────────────────────────────────────────
async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

// ── POST /api/jobs — Create a new job card ───────────────────────────────────
export async function POST(request: Request) {
  const { user, supabase } = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = JobSchema.parse(body);

    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          customer_name: validatedData.customerName,
          quote_number: validatedData.quoteNumber,
          address: validatedData.address,
          date: validatedData.date,
          grand_total: validatedData.grandTotal,
          status: validatedData.status,
          data: validatedData.sections,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 400 });
  }
}

// ── GET /api/jobs — List all job cards ──────────────────────────────────────
export async function GET() {
  const { user, supabase } = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 400 });
  }
}
