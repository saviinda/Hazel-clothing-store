import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@hazel/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const order_status = searchParams.get('order_status') || undefined;
    const payment_status = searchParams.get('payment_status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const filters: any = {};
    if (order_status) filters.order_status = order_status;
    if (payment_status) filters.payment_status = payment_status;
    if (limit) filters.limit = limit;

    const orders = await getOrders(filters);
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
