import { NextRequest, NextResponse } from 'next/server';
import { updateOrderPaymentProof } from '@hazel/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { payment_proof_url } = body;

    if (!payment_proof_url) {
      return NextResponse.json(
        { success: false, error: 'Payment proof URL is required' },
        { status: 400 }
      );
    }

    const order = await updateOrderPaymentProof(params.id, payment_proof_url);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating payment proof:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment proof' },
      { status: 500 }
    );
  }
}
