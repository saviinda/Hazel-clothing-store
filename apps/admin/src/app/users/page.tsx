'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Trash2, Loader2, Mail, Shield, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ConfirmModal from '@/components/ConfirmModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');
  const [currentUserRole, setCurrentUserRole] = useState<string>('Staff');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: string; name: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
    loadCurrentUserRole();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time subscription for users table
  useEffect(() => {
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          loadUsers(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Current user email:', user.email);
        let role = 'Staff';
        if (user.email === 'superadmin@hazel.lk' || user.email === 'superadmin@hazel.com') {
          role = 'Super Admin';
        } else if (user.email === 'admin@hazel.com') {
          role = 'Admin';
        } else if (user.email === 'staff@hazel.com') {
          role = 'Staff';
        } else {
          // Try to get role from API for other users
          try {
            const res = await fetch(`/api/v1/users/${user.id}`);
            const data = await res.json();
            if (data.success && data.data) {
              role = data.data.role;
            }
          } catch (apiErr) {
            console.warn('API call failed, using email-based role:', apiErr);
          }
        }
        console.log('Detected role:', role);
        setCurrentUserRole(role);
      }
    } catch (err) {
      console.error('Error loading current user role:', err);
    }
  };

  const loadUsers = async (silent = false) => {
    try {
      if (users.length === 0 || !silent) {
        setLoading(true);
      } else {
        setRevalidating(true);
      }
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load users');
      setUsers(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.warning('Name and email are required');
      return;
    }
    if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Admin') {
      toast.error('You do not have permission to create users');
      return;
    }
    if (currentUserRole === 'Admin' && newUserRole !== 'Staff') {
      toast.error('Admins can only create Staff users');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create user');

      toast.success('User created! Default password: TempPassword123!');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('Staff');
      setShowCreateModal(false);
      setShowDropdown(false);
      loadUsers(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDropdownSelect = (role: string) => {
    setNewUserRole(role);
    setNewUserName('');
    setNewUserEmail('');
    setShowCreateModal(true);
    setShowDropdown(false);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    console.log('Delete button clicked for user:', userId, userName);
    setConfirmDeleteUser({ id: userId, name: userName });
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update user status');
      toast.success('User status updated successfully');
      loadUsers(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const canCreateUsers = currentUserRole === 'Super Admin' || currentUserRole === 'Admin';
  const canManageAdmins = currentUserRole === 'Super Admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6 animate-fade-in text-brand-secondary">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-secondary">User Management</h1>
          <p className="text-brand-secondary/50 mt-1 text-sm font-semibold">Manage admin and staff accounts</p>
        </div>
        {canCreateUsers && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold px-6 py-3 rounded text-xs tracking-wider transition"
            >
              <Plus size={16} />
              ADD USER
              <ChevronDown size={14} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-primary-light/20 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleDropdownSelect('Staff')}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-brand-secondary hover:bg-brand-primary/5 transition flex items-center gap-2"
                >
                  <Shield size={14} className="text-zinc-500" />
                  Add Staff
                </button>
                {canManageAdmins && (
                  <button
                    onClick={() => handleDropdownSelect('Admin')}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-brand-secondary hover:bg-brand-primary/5 transition flex items-center gap-2 border-t border-brand-primary-light/10"
                  >
                    <Shield size={14} className="text-brand-primary" />
                    Add Admin
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className={`overflow-x-auto transition-opacity duration-200 relative ${revalidating ? 'opacity-60 pointer-events-none' : ''}`}>
        {revalidating && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center z-10 rounded">
            <Loader2 className="animate-spin text-brand-primary" size={24} />
          </div>
        )}
        <table className="w-full text-left border-collapse text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
              <th className="py-4 px-2">User</th>
              <th className="py-4 px-2">Role</th>
              <th className="py-4 px-2">Status</th>
              <th className="py-4 px-2">Created</th>
              <th className="py-4 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary-light/10">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-brand-secondary/40 font-bold italic">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((user) => {
              const isAllowedToToggle =
                currentUserRole === 'Super Admin' ||
                (currentUserRole === 'Admin' && user.role === 'Staff');
              return (
                <tr key={user.id} className="hover:bg-brand-primary/[0.03] transition">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users size={16} className="text-brand-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-brand-secondary">{user.name}</div>
                        <div className="text-xs text-brand-secondary/50 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'Super Admin'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'Admin'
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <Shield size={11} />
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <button
                      onClick={() => {
                        if (isAllowedToToggle) {
                          handleToggleActive(user.id, user.is_active);
                        } else {
                          toast.error('You do not have permission to update this user');
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        user.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } ${isAllowedToToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-4 px-2 text-xs text-brand-secondary/50 font-semibold">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-2 text-right">
                    {user.role !== 'Super Admin' && (canManageAdmins || user.role !== 'Admin') && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1 px-3 text-xs bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border w-full max-w-md rounded shadow-2xl p-8 space-y-6 my-8">
            <h3 className="font-serif text-xl font-bold text-brand-secondary">Create New User</h3>

            <div className="space-y-4 text-sm font-semibold">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Full Name *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Jane Silva"
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Email Address *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. jane@hazel.lk"
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary cursor-pointer text-sm"
                >
                  <option value="Staff">Staff</option>
                  {canManageAdmins && <option value="Admin">Admin</option>}
                </select>
              </div>

              {/* Note */}
              <div className="p-3 bg-brand-primary/5 border border-brand-primary/15 rounded text-xs text-brand-secondary/70 font-semibold">
                Default password will be{' '}
                <span className="font-bold text-brand-secondary">TempPassword123!</span> — user should change it on first login.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 border-t border-brand-primary-light/10 pt-4">
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold h-12 rounded text-xs tracking-wider transition"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}
                CREATE USER
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold h-12 rounded text-xs tracking-wider transition"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteUser !== null}
        title="Delete User"
        message={`Are you sure you want to delete "${confirmDeleteUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          if (!confirmDeleteUser) return;
          const { id } = confirmDeleteUser;
          console.log('=== DELETE START ===');
          console.log('Confirm delete clicked for user ID:', id);
          console.log('Current user role:', currentUserRole);
          try {
            const url = `/api/v1/users/${id}`;
            console.log('Sending DELETE request to:', url);
            console.log('Full URL:', window.location.origin + url);

            const res = await fetch(url, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            console.log('DELETE response received, status:', res.status);
            console.log('DELETE response ok:', res.ok);

            const data = await res.json();
            console.log('DELETE response data:', data);

            if (!data.success) {
              console.error('DELETE returned success=false:', data);
              throw new Error(data.error || data.message || 'Failed to delete user');
            }

            toast.success('User deleted successfully');
            loadUsers(true);
            setConfirmDeleteUser(null);
            console.log('=== DELETE SUCCESS ===');
          } catch (err: any) {
            console.error('=== DELETE ERROR ===');
            console.error('Delete error:', err);
            console.error('Error name:', err.name);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            toast.error(err.message || 'Failed to delete user');
            setConfirmDeleteUser(null);
          }
        }}
        onCancel={() => setConfirmDeleteUser(null)}
      />
    </div>
  );
}
