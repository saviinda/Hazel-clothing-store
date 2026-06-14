import { NextRequest, NextResponse } from 'next/server';
import { getRolePermissions, assignPermissionToRole, removePermissionFromRole } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permissions = await getRolePermissions(id);
    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role permissions' },
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
    const { permission_id, assigned_by } = body;

    if (!permission_id) {
      return NextResponse.json(
        { success: false, error: 'permission_id is required' },
        { status: 400 }
      );
    }

    await assignPermissionToRole(id, permission_id);
    
    // Log the action
    if (assigned_by) {
      await createAuditLog({
        admin_id: assigned_by,
        action: 'assign_permission',
        module: 'roles',
        detail: { role_id: id, permission_id },
      });
    }

    return NextResponse.json({ success: true, message: 'Permission assigned successfully' });
  } catch (error) {
    console.error('Error assigning permission to role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign permission to role' },
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
    const { permission_id, removed_by } = body;

    if (!permission_id) {
      return NextResponse.json(
        { success: false, error: 'permission_id is required' },
        { status: 400 }
      );
    }

    await removePermissionFromRole(id, permission_id);
    
    // Log the action
    if (removed_by) {
      await createAuditLog({
        admin_id: removed_by,
        action: 'remove_permission',
        module: 'roles',
        detail: { role_id: id, permission_id },
      });
    }

    return NextResponse.json({ success: true, message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Error removing permission from role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove permission from role' },
      { status: 500 }
    );
  }
}
