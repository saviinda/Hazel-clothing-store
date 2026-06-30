'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  ShoppingBag, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useRealtimeTable } from '@/hooks/use-realtime-table';

// ── Skeleton primitives ───────────────────────────────────────────────────────
function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-100 rounded ${className}`} />
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-7 w-32 mt-1" />
      </div>
      <SkeletonBox className="h-11 w-11 rounded-full" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBox className="h-5 w-40" />
      <SkeletonBox className="h-64 w-full" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="py-4 px-2"><SkeletonBox className="h-3 w-20" /></td>
      <td className="px-2"><SkeletonBox className="h-3 w-24" /></td>
      <td className="px-2"><SkeletonBox className="h-3 w-16" /></td>
      <td className="px-2"><SkeletonBox className="h-3 w-20" /></td>
      <td className="px-2"><SkeletonBox className="h-5 w-16 rounded-full" /></td>
      <td className="px-2"><SkeletonBox className="h-5 w-20 rounded" /></td>
      <td className="px-2 text-right"><SkeletonBox className="h-7 w-16 ml-auto rounded" /></td>
    </tr>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    pendingVerifications: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const processDashboardData = useCallback((orders: any[], lowStockCount: number) => {
    const totalOrdersCount = orders.length;
    const pendingCount = orders.filter(o => o.order_status === 'Payment Verification').length;
    const verifiedOrders = orders.filter(o => o.payment_status === 'Verified');
    const totalRevenue = verifiedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    setStats({
      totalOrders: totalOrdersCount,
      revenue: totalRevenue,
      pendingVerifications: pendingCount,
      lowStock: lowStockCount,
    });

    setRecentOrders(orders.slice(0, 5));

    const processing = orders.filter(o => o.order_status === 'Processing').length;
    const packed = orders.filter(o => o.order_status === 'Packed').length;
    const shipped = orders.filter(o => o.order_status === 'Shipped').length;
    const completed = orders.filter(o => o.order_status === 'Completed').length;

    setStatusData([
      { name: 'Processing', value: processing, color: '#d4a373' },
      { name: 'Packed', value: packed, color: '#b5838d' },
      { name: 'Shipped', value: shipped, color: '#cc704b' },
      { name: 'Completed', value: completed, color: '#2d6a4f' },
    ]);

    const productSales: Record<string, number> = {};
    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const name = item.name || 'Unknown Product';
        const qty = Number(item.qty) || 1;
        productSales[name] = (productSales[name] || 0) + qty;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    setTopProductsData(topProducts);
  }, []);

  // ── Parallel initial data load ─────────────────────────────────────────────
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [ordersResult, stockResult] = await Promise.all([
          supabase
            .from('orders')
            .select(`*, customer:customer_id (name, phone)`)
            .order('created_at', { ascending: false }),
          supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .lte('stock_qty', 5)
            .eq('is_deleted', false),
        ]);

        if (ordersResult.error) {
          console.error('Error fetching orders:', ordersResult.error);
        }

        processDashboardData(ordersResult.data || [], stockResult.count || 0);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
        setIsLive(true);
      }
    }

    loadDashboardData();
  }, [processDashboardData]);

  // ── Real-time: re-fetch on any order change ────────────────────────────────
  const refreshDashboard = useCallback(async () => {
    try {
      const [ordersResult, stockResult] = await Promise.all([
        supabase
          .from('orders')
          .select(`*, customer:customer_id (name, phone)`)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .lte('stock_qty', 5)
          .eq('is_deleted', false),
      ]);
      processDashboardData(ordersResult.data || [], stockResult.count || 0);
    } catch (err) {
      console.error('Dashboard refresh error:', err);
    }
  }, [processDashboardData]);

  useRealtimeTable({
    table: 'orders',
    channelName: 'dashboard-orders-rt',
    onChange: refreshDashboard,
  });

  useRealtimeTable({
    table: 'products',
    channelName: 'dashboard-products-rt',
    onChange: refreshDashboard,
  });

  // ── Skeleton state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm">
            <ChartSkeleton />
          </div>
          <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm">
            <ChartSkeleton />
          </div>
        </div>
        {/* Table Skeleton */}
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
          <SkeletonBox className="h-5 w-36" />
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-[700px]">
              <table className="w-full text-left border-collapse text-sm">
                <tbody className="divide-y divide-brand-primary-light/5">
                  {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center justify-end gap-2">
          <Radio size={12} className="text-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
        </div>
      )}

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

        {/* Pending Verifications */}
        <Link href="/orders?status=Payment+Verification" className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between hover:border-brand-primary transition">
          <div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Pending Payments</span>
            <h3 className="text-2xl font-bold text-brand-secondary mt-1">{stats.pendingVerifications}</h3>
          </div>
          <div className={`p-3 rounded-full ${stats.pendingVerifications > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-zinc-50 text-zinc-400'}`}>
            <AlertCircle size={20} />
          </div>
        </Link>

        {/* Low Stock */}
        <Link href="/inventory" className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm flex items-center justify-between hover:border-brand-primary transition">
          <div>
            <span className="text-xs font-bold text-brand-secondary/50 uppercase tracking-wider">Low Stock Alerts</span>
            <h3 className="text-2xl font-bold text-brand-secondary mt-1">{stats.lowStock}</h3>
          </div>
          <div className={`p-3 rounded-full ${stats.lowStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-50 text-zinc-400'}`}>
            <TrendingUp size={20} />
          </div>
        </Link>
      </div>

      {/* 2. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">Top Selling Products</h4>
          <div className="h-64 w-full text-xs flex items-center justify-center">
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#b5838d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-brand-secondary/40 italic text-sm">No sales data available.</span>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-4">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">Orders Status Split</h4>
          <div className="h-64 w-full flex items-center justify-center text-xs">
            {stats.totalOrders > 0 ? (
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
            ) : (
              <span className="text-brand-secondary/40 italic text-sm">No orders to display.</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Recent Orders */}
      <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">Recent Orders</h4>
          <Link href="/orders" className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline">
            VIEW ALL
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[700px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                  <th className="py-4 px-2">Order ID</th>
                  <th className="px-2">Customer Name</th>
                  <th className="px-2">Date</th>
                  <th className="px-2">Total</th>
                  <th className="px-2">Payment</th>
                  <th className="px-2">Status</th>
                  <th className="px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary-light/5 text-brand-secondary font-semibold">
                {recentOrders.length > 0 ? (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-2 font-mono text-xs">{ord.id.slice(0, 8)}...</td>
                      <td className="px-2">{ord.customer?.name || 'Guest'}</td>
                      <td className="px-2 text-xs text-brand-secondary/60">{new Date(ord.created_at).toLocaleDateString()}</td>
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
                        <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800 uppercase">
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="text-right px-2">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 bg-brand-primary-light/20 hover:bg-brand-primary hover:text-white transition text-xs font-bold p-1 px-3 rounded text-brand-primary"
                        >
                          <ShieldCheck size={14} />
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-brand-secondary/40 italic">
                      No orders placed yet…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
