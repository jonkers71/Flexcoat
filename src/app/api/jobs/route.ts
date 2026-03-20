import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { JobSchema } from '@/lib/schema';

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
