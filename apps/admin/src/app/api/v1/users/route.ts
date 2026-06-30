import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getUsers } from '@hazel/database';
import { getCallerRole } from '@/lib/auth';



export async function GET(request: NextRequest) {
  try {
    console.log('Fetching users...');
    const users = await getUsers();
    console.log('Users fetched successfully:', users.length);
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const callerRole = await getCallerRole();
    console.log('Caller role:', callerRole);
    if (callerRole !== 'Super Admin' && callerRole !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins and Admins can create users.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, role } = body;
    console.log('Creating user:', { name, email, role });

    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    if (role === 'Super Admin') {
      return NextResponse.json(
        { success: false, error: 'Creating another Super Admin is not allowed' },
        { status: 400 }
      );
    }

    if (callerRole === 'Admin' && role !== 'Staff') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admins can only create Staff users.' },
        { status: 403 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 1. Check if user already exists in database
    console.log('Checking if user exists in database...');
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // 2. Try to create user in Supabase Auth via admin API
    console.log('Creating user in Supabase Auth via admin API...');
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: 'TempPassword123!',
      email_confirm: true,
      user_metadata: { name, role }
    });


    if (authError) {
      console.error('Auth signup error:', authError);
      // Fallback: Create database record only, user will sign up later
      console.log('Auth signup failed, creating database record only...');
      const tempId = crypto.randomUUID();

      const { data: userProfile, error: profileError } = await adminClient
        .from('users')
        .insert({
          id: tempId,
          name,
          email,
          role,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error('Database insertion failed:', profileError);
        console.error('Profile error details:', JSON.stringify(profileError, null, 2));
        // If FK constraint still exists, provide instructions
        if (profileError.code === '23503') {
          return NextResponse.json({
            success: false,
            error: 'Foreign key constraint error. Please run the SQL script in packages/database/remove-users-fk.sql in Supabase SQL Editor to remove the constraint.',
            details: profileError.message
          }, { status: 400 });
        }
        throw new Error(`Failed to create user: ${profileError.message}`);
      }

      return NextResponse.json({
        success: true,
        data: userProfile,
        warning: 'User created in database only. User needs to sign up at the login page with email: ' + email + ' and password: TempPassword123! to activate their account.'
      });
    }

    if (!authData.user) {
      throw new Error('Failed to create user in Supabase Auth: No user returned');
    }

    console.log('Auth user created:', authData.user.id);

    // 3. Wait for trigger to create database record, then fetch it
    console.log('Waiting for trigger to create database record...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for trigger

    const { data: userProfile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      console.warn('Trigger may not have created user record, trying manual insert...');
      const { data: manualProfile, error: manualError } = await adminClient
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (manualError) {
        console.error('Manual insert failed:', manualError);
        throw new Error(`User created in Auth but failed to create database record: ${manualError.message}`);
      }

      return NextResponse.json({ success: true, data: manualProfile });
    }

    console.log('User profile created:', userProfile);

    // 4. Assign role in user_roles table (optional, skip if table doesn't exist)
    try {
      const { data: roleData } = await adminClient
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleData) {
        const { error: userRoleError } = await adminClient
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role_id: roleData.id,
            assigned_at: new Date().toISOString(),
          }, { onConflict: 'user_id,role_id' });

        if (userRoleError) {
          console.warn('Error assigning role to user (non-critical):', userRoleError.message);
        }
      }
    } catch (roleErr) {
      console.warn('Role assignment skipped (table might not exist):', roleErr);
    }

    return NextResponse.json({ success: true, data: userProfile });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

