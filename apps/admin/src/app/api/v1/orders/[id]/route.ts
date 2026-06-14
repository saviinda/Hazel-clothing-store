import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, updateOrderShipping, getCustomerById } from '@hazel/database';
import { EmailService } from '@hazel/services';
import { createAuditLog } from '@hazel/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
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
    const { order_status, payment_status, updated_by, reason, courier, tracking_number } = body;

    let order;
    
    if (courier && tracking_number) {
      // Update shipping info
      order = await updateOrderShipping(id, courier, tracking_number);
      
      // Send shipping update email
      if (order.customer_id) {
        const customer = await getCustomerById(order.customer_id);
        if (customer?.email) {
          EmailService.sendShippingUpdate(
            customer.email,
            customer.name,
            order.id,
            courier,
            tracking_number
          ).catch(err => console.error('Failed to send shipping email:', err));
        }
      }
    } else {
      // Update order status
      order = await updateOrderStatus(id, order_status, payment_status, updated_by, reason);
      
      // Handle payment verification emails
      if (payment_status === 'Verified' || payment_status === 'Rejected') {
        if (order.customer_id) {
          const customer = await getCustomerById(order.customer_id);
          if (customer?.email) {
            EmailService.sendPaymentVerificationResult(
              customer.email,
              customer.name,
              order.id,
              payment_status === 'Verified',
              reason
            ).catch(err => console.error('Failed to send payment verification email:', err));
          }
        }
      }
    }
    
    // Log the action
    if (updated_by) {
      await createAuditLog({
        admin_id: updated_by,
        action: 'update',
        module: 'orders',
        detail: { order_id: order.id, order_status, payment_status },
      });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
