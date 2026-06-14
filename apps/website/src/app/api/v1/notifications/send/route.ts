import { NextResponse } from 'next/server';
import { EmailService } from '@hazel/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, orderId, customerEmail, customerName, totalAmount, reason, courier, trackingNumber } = body;

    if (!type || !orderId || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, error: 'Missing required notification fields.' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'order_confirmation':
        success = await EmailService.sendOrderConfirmation(customerEmail, customerName, orderId, totalAmount || 0);
        break;
      case 'payment_receipt_uploaded':
        // Notify admin that payment receipt was uploaded
        success = await EmailService.sendNewOrderAlertToAdmin(orderId, totalAmount || 0);
        break;
      case 'payment_verified':
        success = await EmailService.sendPaymentVerificationResult(customerEmail, customerName, orderId, true);
        break;
      case 'payment_rejected':
        success = await EmailService.sendPaymentVerificationResult(customerEmail, customerName, orderId, false, reason);
        break;
      case 'shipping_update':
        success = await EmailService.sendShippingUpdate(customerEmail, customerName, orderId, courier || 'Domex', trackingNumber || '');
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success,
      message: success ? 'Notification email dispatched.' : 'Notification dispatch skipped or failed.',
    });
  } catch (error: any) {
    console.error('API send notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Notification route failed.' },
      { status: 500 }
    );
  }
}
