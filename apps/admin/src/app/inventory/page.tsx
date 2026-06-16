'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, InventoryLog } from '@hazel/shared';
import { Loader2, AlertCircle, Plus, Minus, FileSpreadsheet, History } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');

  // Adjustment Form States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustAction, setAdjustAction] = useState<'add' | 'deduct'>('add');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('');

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      const { data: logsData } = await supabase
        .from('inventory_logs')
        .select(`
          *,
          product:product_id (name),
          user:performed_by (name)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (prodData) {
        setProducts(prodData as unknown as Product[]);
        if (prodData.length > 0 && !selectedProductId) {
          setSelectedProductId(prodData[0].id);
        }
      }
      if (logsData) setLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustQty <= 0) return;
    setUpdating(true);

    try {
      const product = products.find((p) => p.id === selectedProductId);
      if (!product) throw new Error('Selected product not found.');

      const oldStock = product.stock_qty;
      const quantityChange = adjustAction === 'add' ? adjustQty : -adjustQty;
      const newStock = Math.max(0, oldStock + quantityChange);

      const userId = (await supabase.auth.getUser()).data.user?.id || null;

      // 1. Update product stock quantity in database
      const { error: prodError } = await supabase
        .from('products')
        .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (prodError) throw new Error(prodError.message);

      // 2. Insert row in public.inventory_logs
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          product_id: product.id,
          action: adjustAction,
          quantity_before: oldStock,
          quantity_after: newStock,
          reason: adjustReason || 'Manual adjustment.',
          performed_by: userId,
          created_at: new Date().toISOString(),
        });

      if (logError) throw new Error(logError.message);

      // 3. Log to public.audit_logs
      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: `stock_${adjustAction}`,
        module: 'inventory',
        detail: { product_id: product.id, product_name: product.name, qty: adjustQty, reason: adjustReason },
      });

      setAdjustQty(1);
      setAdjustReason('');
      await loadInventoryData();
      alert('Stock adjusted successfully!');
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 text-brand-secondary">
      {/* Tab Selectors */}
      <div className="scroll-tabs border-b border-brand-primary-light/15">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'status' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <FileSpreadsheet size={16} />
          STOCK STATUS
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'logs' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <History size={16} />
          INVENTORY ADJUSTMENT LOGS
        </button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : activeTab === 'status' ? (
        /* Tab 1: Current Stock Status & Adjustment Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Stock Table */}
          <div className="lg:col-span-8 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm">
            <h4 className="font-serif text-lg font-bold mb-6">Current Stock Levels</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                    <th className="py-4">Product Name</th>
                    <th>Sizes</th>
                    <th>Colors</th>
                    <th>Current Stock</th>
                    <th>Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-primary-light/5 font-semibold">
                  {products.map((p) => {
                    const lowStock = p.stock_qty <= 5;
                    const outStock = p.stock_qty <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="py-4 font-bold">{p.name}</td>
                        <td className="text-xs text-brand-secondary/60">{p.sizes.join(', ')}</td>
                        <td className="text-xs text-brand-secondary/60">{p.colors.join(', ')}</td>
                        <td className={`font-bold ${outStock ? 'text-red-600' : lowStock ? 'text-yellow-600' : 'text-brand-secondary'}`}>
                          {p.stock_qty} units
                        </td>
                        <td>
                          {outStock ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                              <AlertCircle size={12} /> Out of Stock
                            </span>
                          ) : lowStock ? (
                            <span className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">
                              <AlertCircle size={12} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjustment Form */}
          <div className="lg:col-span-4 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
            <h4 className="font-serif text-lg font-bold">Adjust Product Stock</h4>
            
            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-brand-secondary/65 uppercase block">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary cursor-pointer text-sm font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-brand-secondary/65 uppercase block">Action *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAction('add')}
                      className={`flex-1 flex items-center justify-center gap-1 p-3 border rounded transition ${
                        adjustAction === 'add' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white'
                      }`}
                    >
                      <Plus size={14} />
                      ADD
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction('deduct')}
                      className={`flex-1 flex items-center justify-center gap-1 p-3 border rounded transition ${
                        adjustAction === 'deduct' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white'
                      }`}
                    >
                      <Minus size={14} />
                      REDUCE
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-brand-secondary/65 uppercase block">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-brand-secondary/65 uppercase block">Reason / Memo *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Restocked shipment, Damaged item"
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold placeholder-zinc-300"
                />
              </div>

              <button
                type="submit"
                disabled={updating || products.length === 0}
                className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition"
              >
                {updating && <Loader2 className="animate-spin" size={14} />}
                APPLY ADJUSTMENT
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Tab 2: Inventory Adjustment Logs Table */
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm">
          <h4 className="font-serif text-lg font-bold mb-6">Stock Log History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                  <th className="py-4">Log ID</th>
                  <th>Product</th>
                  <th>Action</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>Performed By</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary-light/5 font-semibold text-xs">
                {logs.length > 0 ? (
                  logs.map((l) => {
                    const diff = l.quantity_after - l.quantity_before;
                    const isAddition = l.action === 'add';
                    return (
                      <tr key={l.id} className="hover:bg-zinc-50/50">
                        <td className="py-4 font-mono text-[10px]">#{l.id.slice(0, 8)}</td>
                        <td className="font-bold text-sm text-brand-secondary">{l.product?.name || 'Deleted Product'}</td>
                        <td>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isAddition ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {l.action}
                          </span>
                        </td>
                        <td>{l.quantity_before}</td>
                        <td>{l.quantity_after}</td>
                        <td className={`font-bold ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                          {isAddition ? `+${diff}` : `${diff}`}
                        </td>
                        <td className="max-w-xs truncate">{l.reason}</td>
                        <td>{l.user?.name || 'System / Auto'}</td>
                        <td className="text-brand-secondary/60">{new Date(l.created_at).toLocaleString()}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-brand-secondary/50 font-bold">
                      No stock adjustments logged yet.
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
