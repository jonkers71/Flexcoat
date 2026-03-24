import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  // Require authentication before sending notifications
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobData, recipientEmail } = await request.json();

    // Use env var for recipient, falling back to the request body, then a default
    const toEmail = process.env.NOTIFICATION_EMAIL || recipientEmail || 'office@flexcoat.com.au';
    // Use env var for sender domain — must be a verified Resend domain in production
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Flexcoat <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `New Job Card Submitted: ${jobData.customerName} - ${jobData.quoteNumber}`,
      html: `
        <h1>New Job Card Submission</h1>
        <p><strong>Customer:</strong> ${jobData.customerName}</p>
        <p><strong>Quote/Job #:</strong> ${jobData.quoteNumber}</p>
        <p><strong>Address:</strong> ${jobData.address}</p>
        <p><strong>Date:</strong> ${jobData.date}</p>
        <p><strong>Grand Total:</strong> $${jobData.grandTotal}</p>
        <br/>
        <p>Log in to the Flexcoat dashboard to view the full details.</p>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
