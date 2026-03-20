import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { JobSchema } from '@/lib/schema';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate with Zod
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
          data: validatedData.sections // Store the full structure here
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API error:', err);
    
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 400 }
    );
  }
}
