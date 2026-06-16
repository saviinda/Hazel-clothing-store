import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getUsers } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const users = await getUsers();
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
    const body = await request.json();
    const { name, email, role } = body;

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

    const adminClient = getSupabaseAdminClient();

    // 1. Create user in Supabase Auth using admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: 'TempPassword123!', // Default password
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user in Auth');

    // Wait slightly or update directly because handle_new_user trigger might have fired.
    // The trigger handles inserting into public.users.
    // Let's update the public.users record to ensure correct role and name.
    const { data: userProfile, error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: authData.user.id,
        name,
        email,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) throw profileError;

    // 2. Assign role in user_roles table
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
        console.error('Error assigning role to user:', userRoleError.message);
      }
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
