import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@hazel/database';
import { EmailService } from '@hazel/services';

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required signup fields.' },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if user already exists
    const { data: { users: existingUsers }, error: searchError } = await adminClient.auth.admin.listUsers();
    if (searchError) throw searchError;

    const existingUser = existingUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    let targetUserId = '';

    if (existingUser) {
      // If user is already confirmed, we should prevent re-registration
      if (existingUser.email_confirmed_at) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists.' },
          { status: 400 }
        );
      }

      // If they exist but are not confirmed, update password and metadata with new OTP
      const { data: updatedUserData, error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          user_metadata: {
            name,
            phone,
            role: 'customer',
            signup_otp: verificationCode,
            signup_otp_created_at: new Date().toISOString()
          }
        }
      );
      if (updateError) throw updateError;
      if (!updatedUserData.user) throw new Error('Failed to update unconfirmed user.');
      targetUserId = updatedUserData.user.id;
    } else {
      // Create new user in inactive (unconfirmed) state
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          name,
          phone,
          role: 'customer',
          signup_otp: verificationCode,
          signup_otp_created_at: new Date().toISOString()
        }
      });
      if (createError) throw createError;
      if (!newUserData.user) throw new Error('Failed to create user.');
      targetUserId = newUserData.user.id;
    }

    // Send the custom verification email using Brevo
    console.log(`Sending verification code ${verificationCode} to ${email} (sender: Hazel Clothing)`);
    const emailSent = await EmailService.sendVerificationCode(email, name, verificationCode);
    if (!emailSent) {
      console.warn('Failed to send verification email via Brevo');
    }

    return NextResponse.json({
      success: true,
      data: {
        user: { id: targetUserId, email },
        session: null
      }
    });
  } catch (error: any) {
    console.error('API signup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
