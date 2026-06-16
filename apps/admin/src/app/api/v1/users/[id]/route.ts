import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = getSupabaseAdminClient();
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const adminClient = getSupabaseAdminClient();

    // Prevent changing role to Super Admin
    if (body.role === 'Super Admin') {
      return NextResponse.json(
        { success: false, error: 'Assigning Super Admin role is not allowed' },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from('users')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If the role was updated, we should also update user_roles mapping
    if (body.role) {
      const { data: roleData } = await adminClient
        .from('roles')
        .select('id')
        .eq('name', body.role)
        .single();

      if (roleData) {
        // Delete old role mappings first
        await adminClient.from('user_roles').delete().eq('user_id', id);

        // Insert new role mapping
        await adminClient.from('user_roles').insert({
          user_id: id,
          role_id: roleData.id,
          assigned_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = getSupabaseAdminClient();

    // Prevent deleting the last Super Admin or check role first
    const { data: userProfile, error: getError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    if (userProfile?.role === 'Super Admin') {
      return NextResponse.json(
        { success: false, error: 'Deleting the Super Admin account is not allowed' },
        { status: 400 }
      );
    }

    // 1. Delete user from Supabase Auth using admin API
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    if (authError) {
      console.warn('Auth deletion warning (user might not exist in Auth):', authError.message);
    }

    // 2. Delete user profile from users table (cascade delete will handle dependent tables like user_roles)
    const { error: dbError } = await adminClient
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
