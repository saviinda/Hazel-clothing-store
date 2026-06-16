'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@hazel/database';
import { Order, OrderStatus } from '@hazel/shared';
import { Loader2, Search, ArrowRight, Upload, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';

const STATUS_STEPS: OrderStatus[] = [
  'Pending Payment',
  'Payment Verification',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Completed',
];

function TrackContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('id') || '';
  const initialPlaced = searchParams.get('placed') === 'true';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [searchInput, setSearchInput] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(initialPlaced ? 'Order placed successfully! Please complete bank payment.' : '');

  // Upload receipt state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUploadedUrl, setReceiptUploadedUrl] = useState('');

  // Dynamic Store Settings State
  const [bankDetails, setBankDetails] = useState({
    bankName: 'Commercial Bank of Ceylon',
    bankBranch: 'Colombo 03',
    accountHolder: 'Hazel Clothing (PVT) Ltd',
    accountNumber: '1000987654'
  });

  useEffect(() => {
    async function loadBankDetails() {
      try {
        const { data: bankData } = await supabase
          .from('content')
          .select('data')
          .eq('section_key', 'bank_details')
          .maybeSingle();

        if (bankData && bankData.data) {
          setBankDetails({
            bankName: bankData.data.bank_name || 'Commercial Bank of Ceylon',
            bankBranch: bankData.data.bank_branch || 'Colombo 03',
            accountHolder: bankData.data.account_holder || 'Hazel Clothing (PVT) Ltd',
            accountNumber: bankData.data.account_number || '1000987654'
          });
        }
      } catch (err) {
        console.error('Failed to load bank details:', err);
      }
    }
    loadBankDetails();
  }, []);

  // Fetch order helper
  const fetchOrder = async (id: string) => {
    if (!id) return;
    let cleanedId = id.trim();
    if (cleanedId.startsWith('#')) {
      cleanedId = cleanedId.substring(1).trim();
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id (name, email, phone)
        `)
        .eq('id', cleanedId)
        .single();


      if (error || !data) {
        throw new Error('Order not found. Check the ID and try again.');
      }

      setOrder(data as unknown as Order);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch order details.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchOrder(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setOrderId(searchInput.trim());
      fetchOrder(searchInput.trim());
    }
  };

  // Upload and attach receipt
  const handleReceiptUpload = async (file: File) => {
    if (!order) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      // 1. Get signed Cloudinary credentials
      const signRes = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'hazel-clothing/payment-proofs' }),
      });

      if (!signRes.ok) throw new Error('Failed to sign upload parameters.');
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      // 2. Post image file directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', 'hazel-clothing/payment-proofs');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Cloudinary upload failure.');
      const uploadData = await uploadRes.json();
      const uploadedUrl = uploadData.secure_url;

      // 3. Update Order inside Supabase
      const updatePayload = {
        payment_proof_url: uploadedUrl,
        payment_status: 'Uploaded',
        order_status: 'Payment Verification',
        status_updated_at: new Date().toISOString(),
        status_history: [
          ...order.status_history,
          {
            status: 'Payment Verification',
            updated_at: new Date().toISOString(),
            updated_by: 'customer',
            reason: 'Payment transfer receipt uploaded by customer.',
          },
        ],
      };

      const { error: dbError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (dbError) throw new Error('Failed to attach receipt to order in database.');

      setReceiptUploadedUrl(uploadedUrl);
      setSuccessMsg('Receipt uploaded successfully! Awaiting manual verification.');
      
      // Send notifications (Brevo trigger to alert admin & customer)
      fetch('/api/v1/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_receipt_uploaded',
          orderId: order.id,
          customerEmail: (order as any).customer?.email,
          customerName: (order as any).customer?.name,
          totalAmount: order.total_amount
        })
      }).catch(err => console.error('Notification dispatch skipped:', err));

      // Refresh order view
      await fetchOrder(order.id);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error occurred during receipt upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      handleReceiptUpload(file);
    }
  };

  // Find step progress index
  const activeStepIndex = order ? STATUS_STEPS.indexOf(order.order_status) : -1;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-12 w-full space-y-12">
      {/* Page Title */}
      <div className="text-center space-y-3">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-secondary">Track Your Order</h1>
        <p className="text-sm text-brand-secondary/60 max-w-md mx-auto">Enter your unique order ID (provided on checkout or confirmation email) to view status history.</p>
      </div>

      {/* Search Bar Form */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto bg-white p-2 border border-brand-primary-light/35 rounded shadow-sm">
        <div className="flex flex-1 items-center gap-2 px-3 py-2 text-brand-secondary/40 min-w-0">
          <Search size={18} className="shrink-0" />
          <input
            type="text"
            required
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter your order ID"
            className="w-full min-w-0 text-sm text-brand-secondary outline-none placeholder-brand-secondary/35 bg-transparent"
          />
        </div>
        <button
          type="submit"
          className="touch-target bg-brand-secondary hover:bg-brand-primary text-white font-bold px-6 rounded text-xs tracking-wider flex items-center justify-center gap-1 transition shrink-0"
        >
          SEARCH
          <ArrowRight size={14} />
        </button>
      </form>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="max-w-2xl mx-auto p-4 bg-green-50 text-green-800 border border-green-200 rounded font-semibold text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-700" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="max-w-2xl mx-auto p-4 bg-red-50 text-red-800 border border-red-200 rounded font-semibold text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-700" />
          {errorMsg}
        </div>
      )}

      {/* Loading animation */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      )}

      {/* Order Tracking Dashboard */}
      {order && !loading && (
        <div className="bg-white p-5 sm:p-8 border border-brand-primary-light/10 rounded shadow-sm space-y-8 sm:space-y-10 animate-fade-in">
          {/* Order Identity Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-primary-light/10 pb-6">
            <div className="min-w-0">
              <span className="text-xs font-bold text-brand-secondary/45 uppercase tracking-widest">ORDER DETAILS</span>
              <h3 className="font-sans text-base sm:text-lg font-bold text-brand-secondary mt-1 break-all">ID: #{order.id}</h3>
              <p className="text-xs text-brand-secondary/65 mt-1">Placed on: {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-brand-secondary/45 uppercase tracking-widest block">TOTAL AMOUNT</span>
              <span className="text-lg font-bold text-brand-primary">LKR {Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Timeline Tracker */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-brand-secondary uppercase tracking-wider">Status Timeline</h4>
            <div className="relative flex flex-col xl:flex-row justify-between gap-4 xl:gap-2 mt-4 xl:mt-8">
              {/* Timeline Connector Line */}
              <div className="absolute top-0 bottom-0 left-[19px] xl:top-5 xl:bottom-auto xl:left-5 xl:right-5 h-full xl:h-0.5 bg-brand-primary-light/20 z-0" />
              
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < activeStepIndex;
                const isActive = idx === activeStepIndex;
                const isPending = idx > activeStepIndex;

                return (
                  <div key={step} className="flex xl:flex-col items-center xl:items-center text-left xl:text-center gap-4 xl:gap-2 z-10 flex-1 min-w-0">
                    {/* Circle Indicator */}
                    <div 
                      className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border transition duration-300 ${
                        isCompleted 
                          ? 'bg-green-600 border-green-600 text-white shadow' 
                          : isActive 
                            ? 'bg-brand-primary border-brand-primary text-white ring-4 ring-brand-primary-light/20 shadow' 
                            : 'bg-white border-brand-primary-light/40 text-brand-secondary/40'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    {/* Label */}
                    <div className="space-y-1 min-w-0">
                      <span className={`text-xs font-bold block truncate xl:whitespace-normal ${isActive ? 'text-brand-primary' : isCompleted ? 'text-green-700' : 'text-brand-secondary/45'}`}>
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-brand-primary-light/10 pt-8">
            {/* Courier Delivery Details */}
            {order.order_status === 'Shipped' && order.tracking_number && (
              <div className="bg-brand-primary-light/5 border border-brand-primary-light/15 p-5 rounded space-y-3">
                <h5 className="font-bold text-sm text-brand-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={16} className="text-brand-primary" />
                  Delivery Tracking
                </h5>
                <p className="text-xs text-brand-secondary/70 leading-relaxed">Your package has been dispatched from our center. You can track your courier progress below.</p>
                <div className="text-sm font-semibold pt-1">
                  <p><span className="text-brand-secondary/55">Courier:</span> {order.courier || 'Domex'}</p>
                  <p className="mt-1"><span className="text-brand-secondary/55">Tracking No:</span> {order.tracking_number}</p>
                </div>
              </div>
            )}

            {/* Offline Receipt Upload Box (Only shows if status is Pending Payment) */}
            {order.order_status === 'Pending Payment' && !receiptUploadedUrl && (
              <div className="bg-brand-primary-light/5 border border-brand-primary-light/20 p-6 rounded space-y-4 md:col-span-2">
                <h5 className="font-bold text-sm text-brand-secondary uppercase tracking-wider">Complete Bank Transfer Payment</h5>
                <p className="text-xs text-brand-secondary/70 leading-relaxed">
                  To verify your order, transfer LKR {Number(order.total_amount).toFixed(2)} to our {bankDetails.bankName} account (Acct: {bankDetails.accountNumber}, {bankDetails.bankBranch}, Holder: {bankDetails.accountHolder}) and upload a screenshot of your payment receipt below.
                </p>

                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-brand-primary-light/35 rounded p-6 bg-white hover:bg-gray-50/50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="text-brand-primary mb-2" size={24} />
                  {isUploading ? (
                    <span className="flex items-center gap-2 text-xs font-semibold text-brand-secondary/75">
                      <Loader2 className="animate-spin text-brand-primary" size={14} />
                      Uploading Receipt image to Cloudinary...
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-brand-secondary/60 text-center">Click or Drag Image to Upload Bank Receipt</span>
                  )}
                </div>
              </div>
            )}

            {/* Order Items summary */}
            <div className="space-y-4 md:col-span-2">
              <h5 className="font-bold text-sm text-brand-secondary uppercase tracking-wider">Items in Order</h5>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-brand-primary-light/5 pb-2">
                    <div>
                      <span className="font-bold text-brand-secondary">{item.name}</span>
                      <span className="text-xs text-brand-secondary/50 block">Size: {item.size} | Color: {item.color} | Qty: {item.qty}</span>
                    </div>
                    <span className="font-semibold text-brand-secondary">LKR {Number(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
