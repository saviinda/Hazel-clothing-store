import { NextRequest, NextResponse } from 'next/server';
import { getRoleById, updateRole, deleteRole } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRoleById(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { updated_by, ...roleData } = body;

    const role = await updateRole(params.id, roleData);
    
    // Log the action
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
  { params }: { params: { id: string } }
) {
  try {
    await deleteRole(params.id);
    
    // Log the action
    const body = await request.json();
    if (body.deleted_by) {
      await createAuditLog({
        admin_id: body.deleted_by,
        action: 'delete',
        module: 'roles',
        detail: { role_id: params.id },
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
