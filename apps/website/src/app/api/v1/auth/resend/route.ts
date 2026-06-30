import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@hazel/database';
import { EmailService } from '@hazel/services';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // Fetch user by email
    const { data: { users }, error: searchError } = await adminClient.auth.admin.listUsers();
    if (searchError) throw searchError;

    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified.' },
        { status: 400 }
      );
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const metadata = user.user_metadata || {};

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...metadata,
          signup_otp: verificationCode,
          signup_otp_created_at: new Date().toISOString()
        }
      }
    );

    if (updateError) throw updateError;

    // Send the custom verification email using Brevo
    console.log(`Resending verification code ${verificationCode} to ${email} (sender: Hazel Clothing)`);
    const name = metadata.name || 'Valued Customer';
    const emailSent = await EmailService.sendVerificationCode(email, name, verificationCode);
    if (!emailSent) {
      console.warn('Failed to resend verification email via Brevo');
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent successfully.'
    });
  } catch (error: any) {
    console.error('API resend code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend verification code.' },
      { status: 500 }
    );
  }
}
