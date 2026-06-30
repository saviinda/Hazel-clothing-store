import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@hazel/database';
import { getCallerRole } from '@/lib/auth';


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
    const callerRole = await getCallerRole();
    if (callerRole !== 'Super Admin' && callerRole !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins and Admins can update users.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const adminClient = getSupabaseAdminClient();

    // Get target user role
    const { data: targetUser } = await adminClient
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    const targetRole = targetUser?.role;

    if (callerRole === 'Admin') {
      if (targetRole !== 'Staff') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admins can only update Staff users.' },
          { status: 403 }
        );
      }
      if (body.role && body.role !== 'Staff') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admins cannot assign roles other than Staff.' },
          { status: 403 }
        );
      }
    }

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
  console.log('[DELETE API] ===== DELETE REQUEST START =====');
  try {
    const { id } = await params;
    console.log('[DELETE API] User ID to delete:', id);

    const callerRole = await getCallerRole();
    console.log('[DELETE API] Caller role:', callerRole);

    if (callerRole !== 'Super Admin' && callerRole !== 'Admin') {
      console.log('[DELETE API] Permission denied - caller role:', callerRole);
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins and Admins can delete users.' },
        { status: 403 }
      );
    }

    const adminClient = getSupabaseAdminClient();
    console.log('[DELETE API] Admin client created');

    console.log('[DELETE API] Fetching target user...');
    const { data: targetUser, error: fetchError } = await adminClient
      .from('users')
      .select('role, email')
      .eq('id', id)
      .single();

    console.log('[DELETE API] Target user data:', targetUser);
    console.log('[DELETE API] Fetch error:', fetchError);

    if (!targetUser) {
      console.log('[DELETE API] User not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const targetRole = targetUser.role;
    console.log('[DELETE API] Target user role:', targetRole);

    if (targetRole === 'Super Admin') {
      console.log('[DELETE API] Cannot delete Super Admin');
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cannot delete Super Admin users.' },
        { status: 403 }
      );
    }

    if (callerRole === 'Admin' && targetRole !== 'Staff') {
      console.log('[DELETE API] Admin cannot delete non-Staff user');
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admins can only delete Staff users.' },
        { status: 403 }
      );
    }

    console.log('[DELETE API] Deleting from user_roles...');
    try {
      await adminClient.from('user_roles').delete().eq('user_id', id);
      console.log('[DELETE API] user_roles deleted (or table does not exist)');
    } catch (roleErr: any) {
      console.warn('[DELETE API] Error deleting from user_roles (table might not exist):', roleErr?.message);
    }

    console.log('[DELETE API] Deleting from users table...');
    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', id);

    console.log('[DELETE API] Delete error:', deleteError);

    if (deleteError) {
      console.error('[DELETE API] Failed to delete user:', deleteError);
      throw deleteError;
    }

    console.log('[DELETE API] User deleted from database');

    console.log('[DELETE API] Deleting from Supabase Auth...');
    try {
      await adminClient.auth.admin.deleteUser(id);
      console.log('[DELETE API] User deleted from Supabase Auth');
    } catch (authErr: any) {
      console.warn('[DELETE API] Error deleting from Supabase Auth (non-critical):', authErr?.message);
    }

    console.log('[DELETE API] ===== DELETE REQUEST SUCCESS =====');
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE API] ===== DELETE REQUEST FAILED =====');
    console.error('[DELETE API] Error:', error);
    console.error('[DELETE API] Error message:', error?.message);
    console.error('[DELETE API] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

