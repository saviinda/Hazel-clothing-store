'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Plus, Trash2, Save, AlertCircle, Lock, Zap } from 'lucide-react';
import { useRoles, useRoleMutations } from '@/hooks/use-roles';
import { usePermissions, useRolePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';

const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

export default function RolePermissionsPage() {
  const { roles: allRoles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { createRole, deleteRole, loading: mutationLoading } = useRoleMutations();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('Staff');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<{ id: string; name: string } | null>(null);

  // Optimistic permission states: maps permissionId -> boolean
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const { 
    permissions: rolePermissions, 
    loading: rolePermsLoading,
    assignPermission, 
    removePermission,
    refetch: refetchRolePerms
  } = useRolePermissions(selectedRole || '');

  // Fetch current user's role from DB
  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      let role = profile?.role as string | undefined;
      // Also check email directly as fallback (matches AdminShell logic)
      if (user.email === 'superadmin@hazel.lk' || user.email === 'superadmin@hazel.com') {
        role = 'Super Admin';
      } else if (user.email === 'admin@hazel.com') {
        role = 'Admin';
      } else if (user.email === 'staff@hazel.com') {
        role = 'Staff';
      }
      
      const isSA = role === 'Super Admin';
      setIsSuperAdmin(isSA);
      setCurrentUserRole(role || 'Staff');
    }
    loadCurrentUser();
  }, []);

  // Filter out Super Admin role for non-super-admin users
  const roles = isSuperAdmin
    ? allRoles
    : allRoles?.filter((r: any) => r.name !== SUPER_ADMIN_ROLE_NAME);

  // Reset optimistic overrides when role changes
  useEffect(() => {
    setOptimisticOverrides({});
    setTogglingIds(new Set());
  }, [selectedRole]);

  // Supabase Realtime: subscribe to role_permissions changes for the selected role
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!selectedRole) return;

    // Unsubscribe from any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`role-perms-${selectedRole}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_permissions',
          filter: `role_id=eq.${selectedRole}`,
        },
        () => {
          // Remote change detected — refresh permissions and clear optimistic state
          refetchRolePerms();
          setOptimisticOverrides({});
          setTogglingIds(new Set());
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedRole, refetchRolePerms]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast({ type: 'error', title: 'Validation Error', message: 'Role name is required.' });
      return;
    }

    try {
      await createRole(
        { name: newRoleName, description: newRoleDescription, is_system: false },
        currentUserId
      );
      toast({ type: 'success', title: 'Role Created', message: `"${newRoleName}" has been created successfully.` });
      setNewRoleName('');
      setNewRoleDescription('');
      setShowCreateModal(false);
      refetchRoles();
    } catch (err: any) {
      toast({ type: 'error', title: 'Create Failed', message: err.message || 'Failed to create role.' });
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    // Guard: never allow deleting Super Admin
    if (roleName === SUPER_ADMIN_ROLE_NAME) {
      toast({ type: 'warning', title: 'Protected Role', message: 'The Super Admin role cannot be deleted.' });
      return;
    }
    setConfirmDeleteRole({ id: roleId, name: roleName });
  };

  const handleTogglePermission = useCallback(async (permissionId: string, currentlyAssigned: boolean) => {
    if (!selectedRole) return;

    const selectedRoleObj = allRoles?.find((r: any) => r.id === selectedRole);
    if (currentUserRole === 'Staff') {
      toast({ type: 'warning', title: 'Access Denied', message: 'Staff members cannot modify permissions.' });
      return;
    }
    if (currentUserRole === 'Admin' && selectedRoleObj?.name !== 'Staff') {
      toast({ type: 'warning', title: 'Access Denied', message: 'Admins can only modify Staff permissions.' });
      return;
    }
    if (selectedRoleObj?.name === SUPER_ADMIN_ROLE_NAME && currentUserRole !== 'Super Admin') {
      toast({ type: 'warning', title: 'Protected Role', message: 'You cannot modify Super Admin permissions.' });
      return;
    }

    // Optimistic update — immediately reflect UI change
    setOptimisticOverrides(prev => ({ ...prev, [permissionId]: !currentlyAssigned }));
    setTogglingIds(prev => new Set(prev).add(permissionId));

    try {
      if (currentlyAssigned) {
        await removePermission(permissionId, currentUserId);
      } else {
        await assignPermission(permissionId, currentUserId);
      }
      // On success, clear optimistic for this perm (real data will come from realtime or refetch)
    } catch (err: any) {
      // Revert optimistic update on failure
      setOptimisticOverrides(prev => {
        const next = { ...prev };
        delete next[permissionId];
        return next;
      });
      toast({ type: 'error', title: 'Permission Error', message: err.message || 'Failed to update permission.' });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(permissionId);
        return next;
      });
    }
  }, [selectedRole, allRoles, currentUserRole, currentUserId, assignPermission, removePermission, toast]);

  const groupedPermissions = permissions?.reduce((acc: any, perm: any) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {}) || {};

  const selectedRoleObj = allRoles?.find((r: any) => r.id === selectedRole);
  
  // Permissions are read-only for:
  // 1. Staff users (Staff cannot modify anything)
  // 2. Admin users when selected role is not Staff (Admin can only modify Staff permissions)
  // 3. Super Admin role when current user is not Super Admin
  const isPermissionsReadOnly = 
    currentUserRole === 'Staff' ||
    (currentUserRole === 'Admin' && selectedRoleObj?.name !== 'Staff') ||
    (selectedRoleObj?.name === SUPER_ADMIN_ROLE_NAME && currentUserRole !== 'Super Admin');

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent" />
          <p className="text-sm text-gray-500">Loading roles...</p>
        </div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading roles: {rolesError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
          <p className="text-gray-600 mt-1">Manage roles and their access permissions</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition shadow-sm"
          >
            <Plus size={18} />
            Create Role
          </button>
        )}
      </div>

      {currentUserRole === 'Staff' && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <Lock size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">View-Only Mode</p>
            <p className="text-amber-700 mt-0.5">Only Super Admins and Admins can modify permissions.</p>
          </div>
        </div>
      )}

      {currentUserRole === 'Admin' && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <Lock size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Admin Restriction Mode</p>
            <p className="text-amber-700 mt-0.5">You can only modify permissions for the Staff role. Other roles are read-only.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Roles</h2>
            <span className="text-xs text-gray-400">{roles?.length || 0} roles</span>
          </div>
          <div className="p-3 space-y-1.5">
            {roles?.map((role: any) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === role.id
                    ? 'bg-brand-primary/8 border-brand-primary/40 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                      {role.name}
                      {role.name === SUPER_ADMIN_ROLE_NAME && (
                        <Shield size={12} className="text-brand-primary shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{role.description || 'No description'}</div>
                  </div>
                  {isSuperAdmin && !role.is_system && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id, role.name);
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition shrink-0"
                      title="Delete role"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {role.is_system && (
                  <div className="text-[10px] text-brand-primary font-semibold mt-1.5 uppercase tracking-wide">System Role</div>
                )}
              </div>
            ))}

            {(!roles || roles.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-6">No roles found.</p>
            )}
          </div>
        </div>

        {/* Permissions Editor */}
        {selectedRole ? (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  {isPermissionsReadOnly && <Lock size={14} className="text-amber-500" />}
                  {selectedRoleObj?.name || 'Role'}
                  <span className="text-xs font-normal text-gray-400">permissions</span>
                </h2>
                {isPermissionsReadOnly && (
                  <p className="text-xs text-amber-600 mt-0.5">Read-only — Permissions modifications restricted</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <Zap size={13} />
                Real-time sync
              </div>
            </div>
            {rolePermsLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-primary border-t-transparent" />
              </div>
            ) : (
              <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                  <div key={resource}>
                    <h3 className="font-semibold text-gray-700 capitalize mb-3 text-sm uppercase tracking-wide">
                      {resource}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(perms as any[]).map((perm: any) => {
                        const serverAssigned = rolePermissions?.some(
                          (rp: any) => rp.permission_id === perm.id
                        );
                        // Use optimistic value if available, otherwise fall back to server state
                        const assigned = Object.prototype.hasOwnProperty.call(optimisticOverrides, perm.id)
                          ? optimisticOverrides[perm.id]
                          : !!serverAssigned;
                        const isToggling = togglingIds.has(perm.id);

                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all select-none ${
                              isPermissionsReadOnly
                                ? 'cursor-not-allowed opacity-70'
                                : isToggling
                                ? 'cursor-wait opacity-80'
                                : 'cursor-pointer'
                            } ${
                              assigned
                                ? 'bg-brand-primary/8 border-brand-primary/40'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={assigned}
                              disabled={isPermissionsReadOnly || isToggling}
                              onChange={() => !isPermissionsReadOnly && handleTogglePermission(perm.id, assigned)}
                              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/30 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm text-gray-700 leading-tight">{perm.action}</span>
                            {isToggling && (
                              <span className="ml-auto h-3 w-3 rounded-full border border-brand-primary border-t-transparent animate-spin shrink-0" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedPermissions).length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">No permissions configured.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 min-h-[200px] text-gray-400">
            <Shield size={32} className="opacity-30" />
            <p className="text-sm font-medium">Select a role to manage permissions</p>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-brand-primary" />
              Create New Role
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRole()}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition"
                  placeholder="e.g., Content Manager"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition resize-none"
                  placeholder="Describe the role's responsibilities..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewRoleName(''); setNewRoleDescription(''); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={mutationLoading || !newRoleName.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutationLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteRole !== null}
        title="Delete Role"
        message={`Are you sure you want to delete role "${confirmDeleteRole?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          if (!confirmDeleteRole) return;
          const { id, name } = confirmDeleteRole;
          setConfirmDeleteRole(null);
          try {
            await deleteRole(id, currentUserId);
            toast({ type: 'success', title: 'Role Deleted', message: `"${name}" has been removed.` });
            if (selectedRole === id) {
              setSelectedRole(null);
            }
            refetchRoles();
          } catch (err: any) {
            toast({ type: 'error', title: 'Delete Failed', message: err.message || 'Failed to delete role.' });
          }
        }}
        onCancel={() => setConfirmDeleteRole(null)}
      />
    </div>
  );
}

