import { NextRequest, NextResponse } from 'next/server';
import { getRoleById, updateRole, deleteRole } from '@hazel/database';
import { createAuditLog } from '@hazel/database';
import { getCallerRole } from '@/lib/auth';

const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await getRoleById(id);
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
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

    // Guard: only Super Admin can update the Super Admin role definition
    const targetRole = await getRoleById(id);
    if (targetRole?.name === SUPER_ADMIN_ROLE_NAME) {
      const callerRole = await getCallerRole();
      if (callerRole !== SUPER_ADMIN_ROLE_NAME) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only Super Admins can modify the Super Admin role.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { updated_by, ...roleData } = body;

    const role = await updateRole(id, roleData);
    
    if (updated_by) {
      await createAuditLog({
        admin_id: updated_by,
        action: 'update',
        module: 'roles',
        detail: { role_id: role.id, role_name: role.name },
      });
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update role' },
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

    // Guard: the Super Admin role can NEVER be deleted, by anyone
    const targetRole = await getRoleById(id);
    if (targetRole?.name === SUPER_ADMIN_ROLE_NAME) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: The Super Admin role cannot be deleted.' },
        { status: 403 }
      );
    }

    // Guard: only Super Admins can delete any other system role
    if (targetRole?.is_system) {
      const callerRole = await getCallerRole();
      if (callerRole !== SUPER_ADMIN_ROLE_NAME) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only Super Admins can delete system roles.' },
          { status: 403 }
        );
      }
    }

    await deleteRole(id);
    
    let deletedBy: string | undefined;
    try {
      const body = await request.json();
      deletedBy = body.deleted_by;
    } catch {}

    if (deletedBy) {
      await createAuditLog({
        admin_id: deletedBy,
        action: 'delete',
        module: 'roles',
        detail: { role_id: id },
      });
    }

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete role' },
      { status: 500 }
    );
  }
}
