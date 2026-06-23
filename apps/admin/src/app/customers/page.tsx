'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  Search, 
  UserCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  TrendingUp, 
  Calendar, 
  X, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: {
    street?: string;
    city?: string;
    postal_code?: string;
  };
  created_at: string;
}

interface Order {
  id: string;
  customer_id: string;
  created_at: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  items: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (customerData) setCustomers(customerData as Customer[]);
        if (orderData) setOrders(orderData as unknown as Order[]);
      } catch (err) {
        console.error('Error loading customers and orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter customers by search term
  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.toLowerCase();
    return (
      cust.name.toLowerCase().includes(term) ||
      (cust.email && cust.email.toLowerCase().includes(term)) ||
      cust.phone.includes(term) ||
      (cust.address.city && cust.address.city.toLowerCase().includes(term))
    );
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // Get orders for selected customer
  const customerOrders = selectedCustomerId 
    ? orders.filter(o => o.customer_id === selectedCustomerId)
    : [];

  // Compute analytics
  const getCustomerStats = (customerId: string) => {
    const custOrders = orders.filter(o => o.customer_id === customerId);
    const totalSpent = custOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    return {
      orderCount: custOrders.length,
      totalSpent
    };
  };

  const selectedCustomerStats = selectedCustomerId 
    ? getCustomerStats(selectedCustomerId)
    : { orderCount: 0, totalSpent: 0 };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(val).replace('LKR', 'Rs.');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-transparent">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 w-full animate-fade-in p-1">
      
      {/* LEFT COLUMN: CUSTOMERS LIST */}
      <div className={`
        flex-1 flex flex-col bg-white border border-brand-primary-light/10 rounded shadow-sm overflow-hidden h-full
        ${selectedCustomerId ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Search Header */}
        <div className="p-4 border-b border-brand-primary-light/20 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 border border-brand-primary-light/35 rounded bg-white px-3 py-2 text-sm focus-within:border-brand-primary">
            <Search size={16} className="text-brand-secondary/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, phone, email, city..."
              className="w-full outline-none bg-transparent"
            />
          </div>
          <div className="text-xs text-brand-secondary/50 font-bold shrink-0">
            {filteredCustomers.length} Customers
          </div>
        </div>

        {/* Table/List container */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-brand-secondary/40 space-y-2">
              <UserCircle size={48} className="mx-auto text-brand-secondary/20" />
              <p className="text-sm font-semibold">No customers found</p>
              <p className="text-xs">Try searching for another name or phone number.</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-primary-light/15">
              {filteredCustomers.map((cust) => {
                const stats = getCustomerStats(cust.id);
                const isSelected = cust.id === selectedCustomerId;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`flex items-center justify-between p-4 cursor-pointer transition duration-150 select-none ${
                      isSelected 
                        ? 'bg-brand-primary-light/15 border-l-4 border-brand-primary pl-3' 
                        : 'hover:bg-slate-50 bg-white border-l-4 border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-brand-secondary truncate">{cust.name}</h4>
                        <span className="text-[10px] text-brand-secondary/40 bg-slate-100 rounded px-1.5 py-0.5 font-medium">
                          {cust.address.city || 'No City'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-secondary/60">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-brand-secondary/40" />
                          {cust.phone}
                        </span>
                        {cust.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail size={12} className="text-brand-secondary/40" />
                            {cust.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right text-xs">
                      <div>
                        <p className="font-bold text-brand-secondary">{stats.orderCount} {stats.orderCount === 1 ? 'order' : 'orders'}</p>
                        <p className="text-brand-primary font-semibold">{formatCurrency(stats.totalSpent)}</p>
                      </div>
                      <ChevronRight size={16} className="text-brand-secondary/30" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED VIEW */}
      <div className={`
        flex-1 lg:flex-[0.8] xl:flex-[0.7] flex flex-col bg-white border border-brand-primary-light/10 rounded shadow-sm overflow-hidden h-full
        ${selectedCustomerId ? 'flex' : 'hidden lg:flex justify-center items-center'}
      `}>
        {selectedCustomer ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header detail */}
            <div className="p-4 border-b border-brand-primary-light/20 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="lg:hidden p-1 rounded hover:bg-slate-200 text-brand-secondary mr-1"
                  title="Back to list"
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 className="font-serif text-lg font-bold text-brand-secondary">Customer Profile</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="hidden lg:block p-1.5 rounded hover:bg-slate-200 text-brand-secondary/50 hover:text-brand-secondary"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Customer summary card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-brand-primary-light/20 rounded-lg bg-brand-primary-cream/20">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-lg">
                    {selectedCustomer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-secondary text-base">{selectedCustomer.name}</h4>
                    <p className="text-xs text-brand-secondary/40 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} />
                      Member since {formatDate(selectedCustomer.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-brand-primary-light/20 pt-3 sm:pt-0 sm:pl-6">
                  <div>
                    <span className="text-[10px] text-brand-secondary/40 uppercase font-bold tracking-wider block">Orders</span>
                    <span className="font-serif text-xl font-bold text-brand-secondary flex items-center gap-1 mt-0.5">
                      <ShoppingBag size={16} className="text-brand-primary" />
                      {selectedCustomerStats.orderCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-secondary/40 uppercase font-bold tracking-wider block">Total Spent</span>
                    <span className="font-serif text-xl font-bold text-brand-primary flex items-center gap-0.5 mt-0.5">
                      <TrendingUp size={16} />
                      {formatCurrency(selectedCustomerStats.totalSpent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-brand-secondary/60">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2.5 p-3 border border-slate-100 rounded">
                    <Phone size={16} className="text-brand-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-brand-secondary/40 uppercase font-bold">Phone Number</p>
                      <p className="font-semibold text-brand-secondary mt-0.5">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 border border-slate-100 rounded">
                    <Mail size={16} className="text-brand-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-brand-secondary/40 uppercase font-bold">Email Address</p>
                      <p className="font-semibold text-brand-secondary mt-0.5 truncate">{selectedCustomer.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-brand-secondary/60">Shipping Address</h4>
                <div className="flex items-start gap-2.5 p-4 border border-slate-100 rounded bg-slate-50/30">
                  <MapPin size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-brand-secondary space-y-1">
                    <p className="font-bold">Primary Address</p>
                    <p className="text-brand-secondary/80">{selectedCustomer.address.street || 'No street provided'}</p>
                    <p className="text-brand-secondary/80">
                      {selectedCustomer.address.city || 'No city'}
                      {selectedCustomer.address.postal_code ? ` - ${selectedCustomer.address.postal_code}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-brand-secondary/60">Order History</h4>
                
                {customerOrders.length === 0 ? (
                  <div className="p-8 text-center text-brand-secondary/40 border border-dashed rounded text-xs">
                    No orders recorded for this customer.
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-brand-secondary/60 font-bold border-b border-slate-100">
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerOrders.map((order) => {
                            // Style status badges
                            let statusClass = 'bg-slate-100 text-slate-700';
                            if (order.order_status === 'Delivered' || order.order_status === 'Completed') {
                              statusClass = 'bg-green-50 text-green-700 border border-green-200';
                            } else if (order.order_status === 'Processing' || order.order_status === 'Shipped') {
                              statusClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                            } else if (order.order_status === 'Payment Verification') {
                              statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                            } else if (order.order_status === 'Cancelled') {
                              statusClass = 'bg-red-50 text-red-700 border border-red-200';
                            }

                            return (
                              <tr key={order.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-brand-secondary font-mono">
                                  #{order.id.slice(0, 8)}
                                </td>
                                <td className="p-3 text-brand-secondary/70">
                                  {formatDate(order.created_at)}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClass}`}>
                                    {order.order_status}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-bold text-brand-secondary">
                                  {formatCurrency(order.total_amount)}
                                </td>
                                <td className="p-3 text-center">
                                  <Link
                                    href={`/orders/${order.id}`}
                                    className="inline-flex items-center gap-1 font-bold text-brand-primary hover:text-brand-secondary transition"
                                  >
                                    View Details
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-brand-secondary/30 space-y-3">
            <UserCircle size={64} className="mx-auto text-brand-secondary/15" />
            <h4 className="font-serif text-lg font-bold">Select a Customer</h4>
            <p className="text-xs max-w-xs mx-auto">
              Click on a customer profile in the list to inspect their contact information, shipping address, and past purchase history.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
