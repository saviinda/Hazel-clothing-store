import { NextRequest, NextResponse } from 'next/server';
import { getUserRoles, assignRoleToUser, removeRoleFromUser } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roles = await getUserRoles(id);
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user roles' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role_id, assigned_by } = body;

    if (!role_id || !assigned_by) {
      return NextResponse.json(
        { success: false, error: 'role_id and assigned_by are required' },
        { status: 400 }
      );
    }

    await assignRoleToUser(id, role_id, assigned_by);
    
    // Log the action
    await createAuditLog({
      admin_id: assigned_by,
      action: 'assign_role',
      module: 'users',
      detail: { user_id: id, role_id },
    });

    return NextResponse.json({ success: true, message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Error assigning role to user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign role to user' },
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
    const body = await request.json();
    const { role_id, removed_by } = body;

    if (!role_id) {
      return NextResponse.json(
        { success: false, error: 'role_id is required' },
        { status: 400 }
      );
    }

    await removeRoleFromUser(id, role_id);
    
    // Log the action
    if (removed_by) {
      await createAuditLog({
        admin_id: removed_by,
        action: 'remove_role',
        module: 'users',
        detail: { user_id: id, role_id },
      });
    }

    return NextResponse.json({ success: true, message: 'Role removed successfully' });
  } catch (error) {
    console.error('Error removing role from user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove role from user' },
      { status: 500 }
    );
  }
}
