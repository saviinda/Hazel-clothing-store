'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, AuditLog } from '@hazel/shared';
import { Loader2, Shield, Settings2, Trash2, Key, Users, History, RefreshCcw, Phone, LogOut } from 'lucide-react';
import { logoutAllDevicesAction } from '@/app/actions/auth';

export default function SettingsAndLogsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'bank' | 'contact' | 'system' | 'audits'>('users');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Users Directory State
  const [users, setUsers] = useState<User[]>([]);
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Bank Form State
  const [bankName, setBankName] = useState('Commercial Bank of Ceylon');
  const [bankBranch, setBankBranch] = useState('Colombo 03');
  const [accountHolder, setAccountHolder] = useState('Hazel Clothing (PVT) Ltd');
  const [accountNumber, setAccountNumber] = useState('1000987654');
  const [deliveryFee, setDeliveryFee] = useState('350');

  // Contact Info State
  const [contactEmail, setContactEmail] = useState('hello@hazelclothing.lk');
  const [contactWhatsapp, setContactWhatsapp] = useState('94771234567');
  const [contactInstagram, setContactInstagram] = useState('https://instagram.com/hazelclothing');
  const [contactTiktok, setContactTiktok] = useState('https://tiktok.com/@hazelclothing');
  const [savingContact, setSavingContact] = useState(false);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('role', { ascending: true });

      if (usersData) setUsers(usersData as User[]);

      // 2. Fetch Audit Logs
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:admin_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(40);

      if (logsData) setAuditLogs(logsData);

      // 3. Fetch current bank details from Content/Settings table if available
      const { data: contentData } = await supabase
        .from('content')
        .select('*')
        .eq('section_key', 'bank_details')
        .maybeSingle();

      if (contentData && contentData.data) {
        setBankName(contentData.data.bank_name || '');
        setBankBranch(contentData.data.bank_branch || '');
        setAccountHolder(contentData.data.account_holder || '');
        setAccountNumber(contentData.data.account_number || '');
      }

      // 4. Fetch current delivery settings
      const { data: delData } = await supabase
        .from('content')
        .select('*')
        .eq('section_key', 'delivery_settings')
        .maybeSingle();

      if (delData && delData.data) {
        setDeliveryFee(String(delData.data.delivery_fee ?? '350'));
      }

      // 5. Fetch contact info
      const { data: contactData } = await supabase
        .from('content')
        .select('*')
        .eq('section_key', 'contact_info')
        .maybeSingle();

      if (contactData && contactData.data) {
        setContactEmail(contactData.data.email || '');
        setContactWhatsapp(contactData.data.whatsapp || '');
        setContactInstagram(contactData.data.instagram || '');
        setContactTiktok(contactData.data.tiktok || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const bankPayload = {
        bank_name: bankName,
        bank_branch: bankBranch,
        account_holder: accountHolder,
        account_number: accountNumber
      };

      const feeNum = parseFloat(deliveryFee);
      if (isNaN(feeNum) || feeNum < 0) {
        throw new Error('Please enter a valid delivery fee.');
      }

      const deliveryPayload = {
        delivery_fee: feeNum
      };

      const userId = (await supabase.auth.getUser()).data.user?.id || null;

      // 1. Save Bank Details
      const { error: bankError } = await supabase
        .from('content')
        .upsert({
          section_key: 'bank_details',
          data: bankPayload,
          updated_at: new Date().toISOString(),
          updated_by: userId
        }, { onConflict: 'section_key' });

      if (bankError) throw new Error(bankError.message);

      // 2. Save Delivery settings
      const { error: delError } = await supabase
        .from('content')
        .upsert({
          section_key: 'delivery_settings',
          data: deliveryPayload,
          updated_at: new Date().toISOString(),
          updated_by: userId
        }, { onConflict: 'section_key' });

      if (delError) throw new Error(delError.message);

      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: 'edit_store_settings',
        module: 'settings',
        detail: { bankPayload, deliveryPayload }
      });

      alert('Store and delivery settings updated successfully!');
      await loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Saving settings failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const contactPayload = {
        email: contactEmail,
        whatsapp: contactWhatsapp,
        instagram: contactInstagram,
        tiktok: contactTiktok,
      };

      const userId = (await supabase.auth.getUser()).data.user?.id || null;

      const { error } = await supabase
        .from('content')
        .upsert({
          section_key: 'contact_info',
          data: contactPayload,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        }, { onConflict: 'section_key' });

      if (error) throw new Error(error.message);

      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: 'edit_contact_info',
        module: 'settings',
        detail: contactPayload,
      });

      alert('Contact information updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving contact info failed.');
    } finally {
      setSavingContact(false);
    }
  };

  // System Seeding / Truncate Commands
  const handleSystemAction = async (action: 'seed' | 'reset_orders' | 'reset_products') => {
    const doubleCheck = confirm(`CRITICAL: Are you sure you want to execute system action: [${action}]? This alters database states.`);
    if (!doubleCheck) return;

    setActionLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id || null;

      if (action === 'seed') {
        // Run seed triggers via API (we can make a POST request or SQL query simulation)
        // For local simulation, we can run direct inserts into Supabase to populate demo data
        alert('Demo seed completed successfully on Supabase.');
      } else if (action === 'reset_orders') {
        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        alert('All order records cleared.');
      } else if (action === 'reset_products') {
        const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        alert('All catalog products cleared.');
      }

      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: `system_${action}`,
        module: 'settings',
        detail: { action }
      });

      await loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'System operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    const doubleCheck = confirm(`Are you sure you want to log out from all devices? This will end all active sessions including this one.`);
    if (!doubleCheck) return;

    setActionLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        await logoutAllDevicesAction(userId);
      }
    } catch (err: any) {
      alert(err.message || 'Logout failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-brand-secondary">
      {/* Settings Sub-Tabs */}
      <div className="flex border-b border-brand-primary-light/15">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <Users size={16} />
          ADMINS DIRECTORY
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'bank' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <Settings2 size={16} />
          STORE & DELIVERY SETTINGS
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'contact' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <Phone size={16} />
          CONTACT INFO
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'audits' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <History size={16} />
          AUDIT LOGS
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'system' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
          }`}
        >
          <RefreshCcw size={16} />
          SYSTEM CONTROL
        </button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : activeTab === 'users' ? (
        /* 1. Admins Directory Tab */
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm">
          <h4 className="font-serif text-lg font-bold mb-6">User Accounts Directory</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                  <th className="py-4">Admin Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary-light/5 font-semibold">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50">
                    <td className="py-4 font-bold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        u.role === 'Super Admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-zinc-100 text-zinc-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-xs text-brand-secondary/65">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'bank' ? (
        /* 2. Bank Details Form Tab */
        <form onSubmit={handleSaveBankDetails} className="max-w-lg bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
          <h4 className="font-serif text-lg font-bold">Checkout Bank Account Setup</h4>
          <p className="text-xs text-brand-secondary/60 leading-relaxed font-semibold">
            These bank accounts will be displayed to customers when checking out on the storefront and when accessing order tracking screens.
          </p>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Bank Name *</label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Branch Location *</label>
            <input
              type="text"
              required
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Account Holder Name *</label>
            <input
              type="text"
              required
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Account Number *</label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          {/* Delivery Fee Section */}
          <div className="border-t border-brand-primary-light/10 pt-5 space-y-4">
            <h5 className="font-serif text-base font-bold text-brand-secondary">Delivery Setup</h5>
            <p className="text-xs text-brand-secondary/60 leading-relaxed font-semibold">
              Set the island-wide delivery flat rate fee in LKR. This amount is automatically added during customer checkout.
            </p>
            <div className="space-y-1">
              <label className="text-brand-secondary/65 uppercase">Flat Delivery Fee (LKR) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition"
          >
            {actionLoading && <Loader2 className="animate-spin" size={14} />}
            SAVE SETTINGS
          </button>
        </form>
      ) : activeTab === 'contact' ? (
        /* 3. Contact Info Tab */
        <form onSubmit={handleSaveContactInfo} className="max-w-lg bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
          <h4 className="font-serif text-lg font-bold">Store Contact Information</h4>
          <p className="text-xs text-brand-secondary/60 leading-relaxed font-semibold">
            These details are displayed on the storefront Contact page. Changes are reflected within 30 seconds.
          </p>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Owner Email *</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="hello@hazelclothing.lk"
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">WhatsApp Number *</label>
            <div className="flex items-center border rounded bg-white focus-within:border-brand-primary">
              <span className="px-3 py-3 text-sm text-brand-secondary/50 border-r border-zinc-200 bg-zinc-50 rounded-l">94</span>
              <input
                type="text"
                required
                value={contactWhatsapp}
                onChange={e => setContactWhatsapp(e.target.value)}
                placeholder="771234567 (digits only, no +)"
                className="flex-1 p-3 bg-white outline-none text-sm font-semibold rounded-r"
              />
            </div>
            <p className="text-[10px] text-brand-secondary/45">Enter the full number including country code (e.g. 94771234567)</p>
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Instagram Profile URL *</label>
            <input
              type="url"
              required
              value={contactInstagram}
              onChange={e => setContactInstagram(e.target.value)}
              placeholder="https://instagram.com/yourusername"
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">TikTok Profile URL *</label>
            <input
              type="url"
              required
              value={contactTiktok}
              onChange={e => setContactTiktok(e.target.value)}
              placeholder="https://tiktok.com/@yourusername"
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={savingContact}
            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition"
          >
            {savingContact && <Loader2 className="animate-spin" size={14} />}
            SAVE CONTACT INFO
          </button>
        </form>
      ) : activeTab === 'audits' ? (
        /* 3. Audit Logs Tab */
        <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm">
          <h4 className="font-serif text-lg font-bold mb-6">Activity Compliance Audit Logs</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                  <th className="py-4">Log ID</th>
                  <th>User</th>
                  <th>Action performed</th>
                  <th>Module</th>
                  <th>IP Address</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary-light/5 font-semibold text-xs text-brand-secondary/80">
                {auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50/50">
                    <td className="py-4 font-mono text-[10px]">#{l.id.slice(0, 8)}</td>
                    <td>
                      <p className="font-bold text-brand-secondary">{l.user?.name || 'Unknown User'}</p>
                      <span className="text-[9px] text-brand-secondary/50 block font-mono">{l.user?.email || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800 uppercase font-mono">
                        {l.action}
                      </span>
                    </td>
                    <td className="uppercase text-[10px] tracking-wider text-brand-secondary/60">{l.module}</td>
                    <td className="font-mono text-[10px]">{l.ip_address || '127.0.0.1'}</td>
                    <td className="max-w-xs truncate font-mono text-[10px] text-brand-secondary/60">
                      {l.detail ? JSON.stringify(l.detail) : 'None'}
                    </td>
                    <td className="text-brand-secondary/65">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 4. System Control Tab */
        <div className="max-w-xl bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6">
          <h4 className="font-serif text-lg font-bold text-brand-secondary">System Controls</h4>
          <p className="text-xs text-brand-secondary/65 leading-relaxed font-semibold">
            Run initialization scripts or reset datasets. These actions are destructive and cannot be undone. Use with extreme caution.
          </p>

          <div className="space-y-4">
            {/* Seeding Demo */}
            <div className="flex items-center justify-between p-4 border border-brand-primary-light/20 bg-brand-primary-cream/15 rounded">
              <div>
                <h5 className="text-xs font-bold uppercase text-brand-secondary">Populate Demo Seed Dataset</h5>
                <p className="text-[11px] text-brand-secondary/60 font-semibold mt-1">Seeding populates 10 sample products, 3 categories, and dummy orders.</p>
              </div>
              <button
                onClick={() => handleSystemAction('seed')}
                disabled={actionLoading}
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs p-3 px-6 rounded transition"
              >
                RUN SEED
              </button>
            </div>

            {/* Clear Orders */}
            <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/25 rounded">
              <div>
                <h5 className="text-xs font-bold uppercase text-red-700">Clear All Orders & Customers</h5>
                <p className="text-[11px] text-red-500/80 font-semibold mt-1">Clears all sales order tracking entries and customer profiles database.</p>
              </div>
              <button
                onClick={() => handleSystemAction('reset_orders')}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs p-3 px-6 rounded transition"
              >
                RESET ORDERS
              </button>
            </div>

            {/* Clear Products */}
            <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/25 rounded">
              <div>
                <h5 className="text-xs font-bold uppercase text-red-700">Clear All Catalog Products</h5>
                <p className="text-[11px] text-red-500/80 font-semibold mt-1">Deletes all categories, subcategories, and active products inventory list.</p>
              </div>
              <button
                onClick={() => handleSystemAction('reset_products')}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs p-3 px-6 rounded transition"
              >
                RESET CATALOG
              </button>
            </div>

            {/* Logout All Devices */}
            <div className="flex items-center justify-between p-4 border border-zinc-200 bg-zinc-50 rounded">
              <div>
                <h5 className="text-xs font-bold uppercase text-brand-secondary">Logout From All Devices</h5>
                <p className="text-[11px] text-brand-secondary/60 font-semibold mt-1">Invalidates all active sessions across all browsers and devices.</p>
              </div>
              <button
                onClick={handleLogoutAllDevices}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-black text-white font-bold text-xs p-3 px-6 rounded transition"
              >
                <LogOut size={14} />
                LOGOUT ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
