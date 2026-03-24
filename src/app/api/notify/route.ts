import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { jobData, recipientEmail } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Flexcoat <onboarding@resend.dev>', // Change to verified domain in production
      to: [recipientEmail || 'office@flexcoat.com.au'],
      subject: `New Job Card Submitted: ${jobData.customerName} - ${jobData.quoteNumber}`,
      html: `
        <h1>New Job Card Submission</h1>
        <p><strong>Customer:</strong> ${jobData.customerName}</p>
        <p><strong>Quote/Job #:</strong> ${jobData.quoteNumber}</p>
        <p><strong>Address:</strong> ${jobData.address}</p>
        <p><strong>Date:</strong> ${jobData.date}</p>
        <p><strong>Grand Total:</strong> $${jobData.grandTotal}</p>
        <br/>
        <p>You can view the full details in the Flexcoat Admin Dashboard (coming soon).</p>
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
