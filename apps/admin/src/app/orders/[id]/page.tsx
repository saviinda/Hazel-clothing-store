'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, PaymentStatus } from '@hazel/shared';
import { Loader2, ArrowLeft, ShieldCheck, ShieldAlert, Truck, Package, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_STEPS: OrderStatus[] = [
  'Pending Payment',
  'Payment Verification',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Completed',
];

export default function OrderDetailPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  // Shipping input states
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Fetch order helper
  const loadOrder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id (name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (data) {
        setOrder(data as unknown as Order);
        setCourier(data.courier || '');
        setTrackingNumber(data.tracking_number || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleVerifyPayment = async (approve: boolean) => {
    if (!order) return;
    setUpdating(true);

    try {
      const nextPaymentStatus: PaymentStatus = approve ? 'Verified' : 'Rejected';
      const nextOrderStatus: OrderStatus = approve ? 'Processing' : 'Pending Payment';
      const timestamp = new Date().toISOString();

      const newHistoryItem = {
        status: nextOrderStatus,
        updated_at: timestamp,
        updated_by: 'admin',
        reason: approve 
          ? 'Payment approved by administrator.' 
          : `Payment rejected. Reason: ${rejectReason || 'Invalid receipt image.'}`,
      };

      const updatePayload = {
        payment_status: nextPaymentStatus,
        order_status: nextOrderStatus,
        status_updated_at: timestamp,
        status_history: [...order.status_history, newHistoryItem],
      };

      // 1. Update database
      const { error: dbError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (dbError) throw new Error(dbError.message);

      // 2. Log admin action to public.audit_logs
      await supabase.from('audit_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: `payment_${approve ? 'approved' : 'rejected'}`,
        module: 'orders',
        detail: { order_id: order.id, reason: rejectReason || null },
      });

      // 3. Trigger asynchronous Brevo email via API route
      if ((order as any).customer?.email) {
        fetch('/api/v1/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: approve ? 'payment_verified' : 'payment_rejected',
            orderId: order.id,
            customerEmail: (order as any).customer?.email,
            customerName: (order as any).customer?.name,
            reason: rejectReason || null,
          }),
        }).catch((err) => console.error('Email trigger failed:', err));
      }

      setShowRejectForm(false);
      setRejectReason('');
      toast.success(approve ? 'Payment transfer verified successfully!' : 'Payment transfer rejected successfully.');
      await loadOrder();
    } catch (err: any) {
      toast.error(err.message || 'Verification update failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);

    try {
      const timestamp = new Date().toISOString();
      const newHistoryItem = {
        status: nextStatus,
        updated_at: timestamp,
        updated_by: 'admin',
        reason: `Order status moved to ${nextStatus}.`,
      };

      const updatePayload: Record<string, any> = {
        order_status: nextStatus,
        status_updated_at: timestamp,
        status_history: [...order.status_history, newHistoryItem],
      };

      // If updating to Shipped, attach courier details
      if (nextStatus === 'Shipped') {
        if (!courier || !trackingNumber) {
          throw new Error('Courier and Tracking Number are required when shipping.');
        }
        updatePayload.courier = courier;
        updatePayload.tracking_number = trackingNumber;
      }

      // 1. Update database
      const { error: dbError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (dbError) throw new Error(dbError.message);

      // 2. Log admin action to public.audit_logs
      await supabase.from('audit_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: `status_changed_${nextStatus.toLowerCase().replace(/\s+/g, '_')}`,
        module: 'orders',
        detail: { order_id: order.id, courier: courier || null, tracking_number: trackingNumber || null },
      });

      // 3. Trigger email if Shipped or Completed
      if (nextStatus === 'Shipped' && (order as any).customer?.email) {
        fetch('/api/v1/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'shipping_update',
            orderId: order.id,
            customerEmail: (order as any).customer?.email,
            customerName: (order as any).customer?.name,
            courier,
            trackingNumber,
          }),
        }).catch((err) => console.error('Email trigger failed:', err));
      }

      toast.success(`Order status updated to ${nextStatus}.`);
      await loadOrder();
    } catch (err: any) {
      toast.error(err.message || 'Status transition failed.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-8 text-center text-brand-secondary/60 rounded border">
        Order not found.
      </div>
    );
  }

  const activeStepIdx = STATUS_STEPS.indexOf(order.order_status);
  const nextStep = STATUS_STEPS[activeStepIdx + 1];

  return (
    <div className="space-y-8 animate-fade-in text-brand-secondary">
      {/* Back Button */}
      <div>
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary/65 hover:text-brand-primary">
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: order data */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Header info */}
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-brand-secondary/55 uppercase tracking-widest">Order ID</span>
                <h3 className="text-lg font-bold font-mono mt-1">#{order.id}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary uppercase">
                  {order.order_status}
                </span>
                <span className="inline-flex items-center rounded bg-brand-secondary/10 px-3 py-1 text-xs font-bold text-brand-secondary uppercase">
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Address details */}
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-serif text-base font-bold mb-4">Customer Contact Details</h4>
              <p className="text-sm font-semibold"><span className="text-brand-secondary/55">Name:</span> {(order as any).customer?.name || 'Guest'}</p>
              <p className="text-sm font-semibold mt-2"><span className="text-brand-secondary/55">Phone:</span> {(order as any).customer?.phone || 'N/A'}</p>
              <p className="text-sm font-semibold mt-2"><span className="text-brand-secondary/55">Email:</span> {(order as any).customer?.email || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-serif text-base font-bold mb-4">Shipping Address</h4>
              <p className="text-sm font-semibold">{order.shipping_address.name}</p>
              <p className="text-sm font-semibold mt-1">{order.shipping_address.street}</p>
              <p className="text-sm font-semibold mt-1">{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
              <p className="text-sm font-semibold mt-1">Phone: {order.shipping_address.phone}</p>
            </div>
          </div>

          {/* Ordered items */}
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
            <h4 className="font-serif text-base font-bold">Items Summary</h4>
            <div className="divide-y divide-brand-primary-light/10">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-9 rounded overflow-hidden bg-gray-50 border flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url || '/placeholder.jpg'} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <span className="text-xs text-brand-secondary/50">Size: {item.size} | Color: {item.color} | Qty: {item.qty}</span>
                    </div>
                  </div>
                  <span className="font-bold">LKR {Number(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-brand-primary-light/10 pt-4 font-bold text-base">
              <span>Total Amount</span>
              <span className="text-brand-primary">LKR {Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Workflow history logs */}
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
            <h4 className="font-serif text-base font-bold">Status History Log</h4>
            <div className="relative border-l border-brand-primary-light/35 pl-6 ml-3 space-y-6 text-sm">
              {order.status_history.map((hist, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border bg-white border-brand-primary" />
                  <p className="font-bold text-brand-secondary text-xs">{hist.status}</p>
                  <p className="text-brand-secondary/70 text-xs mt-1">{hist.reason}</p>
                  <span className="text-[10px] text-brand-secondary/40 block mt-1">
                    Updated by: <span className="uppercase font-bold">{hist.updated_by}</span> on {new Date(hist.updated_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Action panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Payment receipt verification card */}
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
            <h4 className="font-serif text-base font-bold">Verify Payment Proof</h4>
            
            {order.payment_proof_url ? (
              <div className="space-y-4">
                {/* Expiring Image view panel */}
                <div className="relative aspect-[3/4] w-full rounded border bg-gray-50 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.payment_proof_url} alt="Bank transfer receipt screenshot" className="h-full w-full object-contain" />
                  <a 
                    href={order.payment_proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-brand-secondary/45 text-white font-bold text-xs gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition duration-300"
                  >
                    <Eye size={16} />
                    View Large Image
                  </a>
                </div>

                {/* Verification Actions */}
                {order.payment_status === 'Uploaded' && (
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => handleVerifyPayment(true)}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded text-xs tracking-wider transition"
                    >
                      <ShieldCheck size={16} />
                      APPROVE PAYMENT
                    </button>
                    
                    {!showRejectForm ? (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded text-xs tracking-wider transition"
                      >
                        <ShieldAlert size={16} />
                        REJECT PAYMENT
                      </button>
                    ) : (
                      <div className="p-4 border border-red-200 bg-red-50/50 rounded space-y-3 animate-fade-in">
                        <textarea
                          placeholder="Provide a reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full text-xs rounded border border-brand-primary-light/35 p-2 bg-white outline-none focus:border-red-500 h-20 font-medium"
                        />
                        <div className="flex gap-2 text-[10px] font-bold">
                          <button
                            onClick={() => handleVerifyPayment(false)}
                            className="flex-1 bg-red-600 text-white rounded p-2 text-center"
                          >
                            CONFIRM REJECT
                          </button>
                          <button
                            onClick={() => setShowRejectForm(false)}
                            className="flex-1 bg-zinc-200 text-zinc-700 rounded p-2 text-center"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center border-2 border-dashed border-brand-primary-light/25 text-brand-secondary/55 text-xs font-semibold rounded bg-gray-50">
                Awaiting payment receipt upload from customer.
              </div>
            )}
          </div>

          {/* Workflow order status change card */}
          {order.payment_status === 'Verified' && nextStep && (
            <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
              <h4 className="font-serif text-base font-bold">Update Order Status</h4>
              
              {/* If next step is Shipped, require courier info */}
              {nextStep === 'Shipped' && (
                <div className="space-y-3 p-4 border border-brand-primary-light/25 bg-brand-primary-cream/15 rounded text-xs font-bold">
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-secondary/65 uppercase tracking-wide">Courier Partner *</label>
                    <input
                      type="text"
                      placeholder="e.g. Domex, PromptX"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full border rounded p-2 outline-none focus:border-brand-primary bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-secondary/65 uppercase tracking-wide">Courier Tracking Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. DMX0098765"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full border rounded p-2 outline-none focus:border-brand-primary bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => handleUpdateStatus(nextStep)}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold h-12 rounded text-xs tracking-wider transition"
              >
                <Package size={16} />
                MOVE TO: {nextStep.toUpperCase()}
              </button>
            </div>
          )}

          {order.order_status === 'Completed' && (
            <div className="bg-green-50 text-green-800 border border-green-200 p-6 rounded shadow-sm text-center text-xs font-bold flex flex-col items-center gap-2">
              <Clock size={20} className="text-green-700" />
              <span>ORDER SUCCESSFULLY COMPLETED</span>
              <p className="font-medium text-green-700/80 mt-1">This order is completed and archived. No further status changes can be made.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
