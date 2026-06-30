import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@hazel/database';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing email or verification token.' },
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

    const metadata = user.user_metadata || {};
    const expectedOtp = metadata.signup_otp;
    const otpCreatedAt = metadata.signup_otp_created_at;

    if (!expectedOtp || expectedOtp !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code.' },
        { status: 400 }
      );
    }

    // Verify expiration (15 minutes expiration window)
    if (otpCreatedAt) {
      const createdTime = new Date(otpCreatedAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - createdTime) / (1000 * 60);

      if (diffMinutes > 15) {
        return NextResponse.json(
          { success: false, error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }
    }

    // Clean up OTP metadata and confirm email
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.signup_otp;
    delete cleanMetadata.signup_otp_created_at;

    const { error: confirmError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
        user_metadata: cleanMetadata
      }
    );

    if (confirmError) throw confirmError;

    return NextResponse.json({
      success: true,
      message: 'Account verified successfully.'
    });
  } catch (error: any) {
    console.error('API verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
