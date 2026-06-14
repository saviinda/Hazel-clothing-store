import { NextRequest, NextResponse } from 'next/server';
import { getRoles, createRole } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const roles = await getRoles();
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { created_by, ...roleData } = body;

    if (!created_by) {
      return NextResponse.json(
        { success: false, error: 'created_by is required' },
        { status: 400 }
      );
    }

    const role = await createRole(roleData);
    
    // Log the action
    await createAuditLog({
      admin_id: created_by,
      action: 'create',
      module: 'roles',
      detail: { role_id: role.id, role_name: role.name },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create role' },
      { status: 500 }
    );
  }
}
