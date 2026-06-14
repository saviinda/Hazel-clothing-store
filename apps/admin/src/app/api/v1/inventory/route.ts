import { NextRequest, NextResponse } from 'next/server';
import { getInventoryLogs, adjustInventory } from '@hazel/database';
import { createAuditLog } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const product_id = searchParams.get('product_id') || undefined;

    const logs = await getInventoryLogs(product_id);
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, action, quantity, reason, performed_by } = body;

    if (!product_id || !action || !quantity || !reason || !performed_by) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await adjustInventory(product_id, action, quantity, reason, performed_by);
    
    // Log the action
    await createAuditLog({
      admin_id: performed_by,
      action: 'inventory_adjust',
      module: 'inventory',
      detail: { product_id, action, quantity, reason },
    });

    return NextResponse.json({ success: true, message: 'Inventory adjusted successfully' });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
}
