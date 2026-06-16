'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useRoles, useRoleMutations } from '@/hooks/use-roles';
import { usePermissions, useRolePermissions } from '@/hooks/use-permissions';

export default function RolePermissionsPage() {
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const { createRole, updateRole, deleteRole, loading: mutationLoading } = useRoleMutations();
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { 
    permissions: rolePermissions, 
    loading: rolePermsLoading,
    assignPermission, 
    removePermission 
  } = useRolePermissions(selectedRole || '');

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setError(null);
      await createRole(
        { name: newRoleName, description: newRoleDescription, is_system: false },
        'current-user-id' // Replace with actual user ID from auth
      );
      setSuccess('Role created successfully');
      setNewRoleName('');
      setNewRoleDescription('');
      setShowCreateModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      setError(null);
      await deleteRole(roleId, 'current-user-id'); // Replace with actual user ID
      setSuccess('Role deleted successfully');
      if (selectedRole === roleId) {
        setSelectedRole(null);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const handleTogglePermission = async (permissionId: string, isAssigned: boolean) => {
    if (!selectedRole) return;

    try {
      setError(null);
      if (isAssigned) {
        await removePermission(permissionId, 'current-user-id'); // Replace with actual user ID
      } else {
        await assignPermission(permissionId, 'current-user-id'); // Replace with actual user ID
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update permission');
    }
  };

  const groupedPermissions = permissions?.reduce((acc: any, perm: any) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {}) || {};

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
          <p className="text-gray-600 mt-1">Manage roles and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Create Role
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Shield size={18} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Roles</h2>
          </div>
          <div className="p-4 space-y-2">
            {roles?.map((role: any) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedRole === role.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{role.description || 'No description'}</div>
                  </div>
                  {!role.is_system && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id, role.name);
                      }}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {role.is_system && (
                  <div className="text-xs text-blue-600 mt-1">System Role</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Editor */}
        {selectedRole && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                Permissions for {roles?.find((r: any) => r.id === selectedRole)?.name}
              </h2>
            </div>
            {rolePermsLoading ? (
              <div className="p-4 text-gray-500">Loading permissions...</div>
            ) : (
              <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                  <div key={resource}>
                    <h3 className="font-medium text-gray-900 capitalize mb-3">{resource}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(perms as any[]).map((perm: any) => {
                        const isAssigned = rolePermissions?.some(
                          (rp: any) => rp.permission_id === perm.id
                        );
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                              isAssigned
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleTogglePermission(perm.id, isAssigned)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{perm.action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Content Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the role's responsibilities"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={mutationLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save size={18} />
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
