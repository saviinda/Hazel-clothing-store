import { NextResponse } from 'next/server';
import { EmailService } from '@hazel/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, ownerEmail } = body;

    if (!name || !email || !message || !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required message fields.' },
        { status: 400 }
      );
    }

    const success = await EmailService.sendContactMessage({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      subject: subject || 'Website Enquiry',
      message: message,
      ownerEmail: ownerEmail,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send message via Brevo service.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully.',
    });
  } catch (error: any) {
    console.error('API contact submit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Contact message submission failed.' },
      { status: 500 }
    );
  }
}
