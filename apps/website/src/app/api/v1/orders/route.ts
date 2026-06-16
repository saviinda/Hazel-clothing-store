import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@hazel/database';
import { EmailService } from '@hazel/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, street, city, postal_code, payment_proof_url, items, total_amount } = body;

    if (!name || !phone || !street || !city || !postal_code || !items || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required checkout information.' },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // 1. Resolve or Create Customer Profile
    let customerId = '';
    // Look up by phone number first
    let { data: existingCustomer } = await adminClient
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    // If not found by phone, look up by email (if email is provided)
    if (!existingCustomer && email) {
      const { data: existingByEmail } = await adminClient
        .from('customers')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      existingCustomer = existingByEmail;
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update the customer details with the latest shipping info
      await adminClient
        .from('customers')
        .update({
          name,
          phone,
          email: email || null,
          address: { street, city, postal_code },
        })
        .eq('id', customerId);
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await adminClient
        .from('customers')
        .insert({
          name,
          email: email || null,
          phone,
          address: { street, city, postal_code },
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        throw new Error(customerError?.message || 'Failed to create customer profile.');
      }
      customerId = newCustomer.id;
    }

    // 2. Determine Initial Statuses
    const hasProof = !!payment_proof_url;
    const paymentStatus = hasProof ? 'Uploaded' : 'Pending';
    const orderStatus = hasProof ? 'Payment Verification' : 'Pending Payment';
    const initialHistoryItem = {
      status: orderStatus,
      updated_at: new Date().toISOString(),
      updated_by: 'system',
      reason: hasProof ? 'Order placed with bank receipt uploaded.' : 'Order placed, awaiting bank transfer.',
    };

    // 3. Insert Order in database
    const { data: newOrder, error: orderError } = await adminClient
      .from('orders')
      .insert({
        customer_id: customerId,
        items,
        total_amount,
        payment_method: 'Bank Transfer',
        payment_status: paymentStatus,
        payment_proof_url: payment_proof_url || null,
        order_status: orderStatus,
        shipping_address: { name, phone, street, city, postal_code },
        status_history: [initialHistoryItem],
      })
      .select('*')
      .single();

    if (orderError || !newOrder) {
      throw new Error(orderError?.message || 'Failed to create order entry.');
    }

    // 4. Trigger Emails Asynchronously (non-blocking)
    if (email) {
      EmailService.sendOrderConfirmation(email, name, newOrder.id, Number(total_amount))
        .catch((err) => console.error('Failed to send customer order email:', err));
    }
    
    EmailService.sendNewOrderAlertToAdmin(newOrder.id, Number(total_amount))
      .catch((err) => console.error('Failed to send admin order alert email:', err));

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order placed successfully.',
    });
  } catch (error: any) {
    console.error('API checkout submit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Order submission failed.' },
      { status: 500 }
    );
  }
}
