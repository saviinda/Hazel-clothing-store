'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Order, Product } from '@hazel/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  ShoppingBag, 
  DollarSign, 
  Loader2, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 15,
    revenue: 42500,
    pendingVerifications: 2,
    lowStock: 3,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock charts data
  const statusData = [
    { name: 'Processing', value: 4, color: '#d4a373' },
    { name: 'Packed', value: 3, color: '#b5838d' },
    { name: 'Shipped', value: 5, color: '#cc704b' },
    { name: 'Completed', value: 3, color: '#2d6a4f' },
  ];

  const topProductsData = [
    { name: 'Linen Midi Dress', sales: 12 },
    { name: 'Mom Jeans', sales: 9 },
    { name: 'Square Neck Top', sales: 8 },
    { name: 'Crop Top', sales: 6 },
    { name: 'Summer Wrap Dress', sales: 4 },
  ];

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Fetch Orders details
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customer_id (name, phone)
          `)
          .order('created_at', { ascending: false });

        // 2. Fetch Low Stock counts
        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('stock_qty', 5)
          .eq('is_deleted', false);

        if (ordersData && ordersData.length > 0) {
          // Calculate stats
          const totalOrdersCount = ordersData.length;
          const pendingCount = ordersData.filter(o => o.order_status === 'Payment Verification').length;
          const verifiedOrders = ordersData.filter(o => o.payment_status === 'Verified');
          const totalRevenue = verifiedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

          setStats({
            totalOrders: totalOrdersCount,
            revenue: totalRevenue,
            pendingVerifications: pendingCount,
            lowStock: lowStockCount || 0,
          });

          setRecentOrders(ordersData.slice(0, 5));
        } else {
          // Use some mock recent orders if database is blank
          setRecentOrders([
            { id: 'o1', customer: { name: 'Minoli Perera' }, total_amount: 4200, payment_status: 'Pending', order_status: 'Pending Payment', created_at: new Date().toISOString() },
            { id: 'o2', customer: { name: 'Avanthi De Silva' }, total_amount: 7900, payment_status: 'Uploaded', order_status: 'Payment Verification', created_at: new Date().toISOString() },
            { id: 'o3', customer: { name: 'Dilini W.' }, total_amount: 2400, payment_status: 'Verified', order_status: 'Completed', created_at: new Date().toISOString() },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand-secondary/50 uppercase tracking-wider">Revenue (Verified)</span>
            <h3 className="text-2xl font-bold text-brand-secondary mt-1">LKR {stats.revenue.toFixed(2)}</h3>
          </div>
          <div className="p-3 rounded-full bg-green-50 text-green-700">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-brand-secondary/50 uppercase tracking-wider">Total Orders</span>
            <h3 className="text-2xl font-bold text-brand-secondary mt-1">{stats.totalOrders}</h3>
          </div>
          <div className="p-3 rounded-full bg-blue-50 text-blue-700">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Pending Verifications (Urgent) */}
        <Link href="/orders?status=Payment+Verification" className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between hover:border-brand-primary transition">
          <div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Pending Payments</span>
            <h3 className="text-2xl font-bold text-brand-secondary mt-1">{stats.pendingVerifications}</h3>
          </div>
          <div className={`p-3 rounded-full ${stats.pendingVerifications > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-zinc-50 text-zinc-400'}`}>
            <AlertCircle size={20} />
          </div>
        </Link>

        {/* Low Stock Alerts */}
        <Link href="/inventory" className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between hover:border-brand-primary transition">
          <div>
            <span className="text-xs font-bold text-brand-secondary/50 uppercase tracking-wider">Low Stock alerts</span>
            <h3 className="text-2xl font-bold text-brand-secondary mt-1">{stats.lowStock}</h3>
          </div>
          <div className={`p-3 rounded-full ${stats.lowStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-50 text-zinc-400'}`}>
            <TrendingUp size={20} />
          </div>
        </Link>
      </div>

      {/* 2. Charts Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Products Sales (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">Top Selling Products</h4>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#b5838d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status (Pie Chart) */}
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">Orders Status Split</h4>
          <div className="h-64 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Recent Orders Panel */}
      <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">Recent Orders</h4>
          <Link href="/orders" className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline">
            VIEW ALL
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                <th className="py-4">Order ID</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary-light/5 text-brand-secondary font-semibold">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-zinc-50/50">
                  <td className="py-4 font-mono text-xs">{ord.id.slice(0, 8)}...</td>
                  <td>{ord.customer?.name || 'Guest'}</td>
                  <td className="text-xs text-brand-secondary/60">{new Date(ord.created_at).toLocaleDateString()}</td>
                  <td>LKR {Number(ord.total_amount).toFixed(2)}</td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      ord.payment_status === 'Verified' ? 'bg-green-100 text-green-800' :
                      ord.payment_status === 'Uploaded' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                      ord.payment_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ord.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800 uppercase">
                      {ord.order_status}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="inline-flex items-center gap-1 bg-brand-primary-light/20 hover:bg-brand-primary hover:text-white transition text-xs font-bold p-1 px-3 rounded text-brand-primary"
                    >
                      <ShieldCheck size={14} />
                      Verify
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
