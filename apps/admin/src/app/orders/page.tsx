'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, PaymentStatus } from '@hazel/shared';
import { Loader2, Search, Filter, ShieldCheck, ChevronRight } from 'lucide-react';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            customer:customer_id (name, phone)
          `)
          .order('created_at', { ascending: false });

        if (statusFilter) {
          query = query.eq('order_status', statusFilter);
        }
        if (paymentFilter) {
          query = query.eq('payment_status', paymentFilter);
        }

        const { data, error } = await query;
        if (data) {
          setOrders(data as unknown as Order[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [statusFilter, paymentFilter]);

  // Client side search filter
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch = 
      ord.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((ord as any).customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((ord as any).customer?.phone || '').includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6 animate-fade-in">
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex w-full md:max-w-xs items-center gap-2 border border-brand-primary-light/35 rounded bg-white p-3 text-sm focus-within:border-brand-primary">
          <Search size={16} className="text-brand-secondary/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, phone..."
            className="w-full outline-none bg-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center justify-end text-xs font-bold">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-brand-secondary/40" />
            <span className="text-brand-secondary/50 uppercase">Order Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-brand-primary-light/35 rounded p-2 bg-white text-brand-secondary cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending Payment">Pending Payment</option>
              <option value="Payment Verification">Payment Verification</option>
              <option value="Processing">Processing</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-brand-secondary/50 uppercase">Payment Status</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-brand-primary-light/35 rounded p-2 bg-white text-brand-secondary cursor-pointer"
            >
              <option value="">All Payments</option>
              <option value="Pending">Pending</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : (
        /* Orders Table */
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[800px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                  <th className="py-4 px-2">Order ID</th>
                  <th className="px-2">Customer Name</th>
                  <th className="px-2">Contact Phone</th>
                  <th className="px-2">Total</th>
                  <th className="px-2">Payment</th>
                  <th className="px-2">Order Status</th>
                  <th className="px-2">Date Placed</th>
                  <th className="px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary-light/5 text-brand-secondary font-semibold">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-50/50">
                      <td className="py-4 px-2 font-mono text-xs">#{ord.id.slice(0, 8)}...</td>
                      <td className="px-2">{(ord as any).customer?.name || 'Guest'}</td>
                      <td className="px-2">{(ord as any).customer?.phone || 'N/A'}</td>
                      <td className="px-2">LKR {Number(ord.total_amount).toFixed(2)}</td>
                      <td className="px-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ord.payment_status === 'Verified' ? 'bg-green-100 text-green-800' :
                          ord.payment_status === 'Uploaded' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          ord.payment_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="px-2">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ord.order_status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                          ord.order_status === 'Pending Payment' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          ord.order_status === 'Payment Verification' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                          'bg-zinc-100 text-zinc-800'
                        }`}>
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="px-2 text-xs text-brand-secondary/60">{new Date(ord.created_at).toLocaleDateString()}</td>
                      <td className="px-2 text-right">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 bg-brand-primary-light/20 hover:bg-brand-primary hover:text-white transition text-xs font-bold p-1 px-3 rounded text-brand-primary"
                        >
                          Verify
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-brand-secondary/50 font-bold">
                      No orders found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
