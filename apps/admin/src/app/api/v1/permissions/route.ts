import { NextRequest, NextResponse } from 'next/server';
import { getPermissions, createPermission } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const permissions = await getPermissions();
    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { created_by, ...permissionData } = body;

    if (!created_by) {
      return NextResponse.json(
        { success: false, error: 'created_by is required' },
        { status: 400 }
      );
    }

    const permission = await createPermission(permissionData);
    
    // Log the action
    await createAuditLog({
      admin_id: created_by,
      action: 'create',
      module: 'permissions',
      detail: { permission_id: permission.id, permission_name: permission.name },
    });

    return NextResponse.json({ success: true, data: permission });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
