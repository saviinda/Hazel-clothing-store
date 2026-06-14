import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Permission } from '@hazel/shared';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        setLoading(true);
        const data = await adminApi.getPermissions();
        setPermissions(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, []);

  return { permissions, loading, error };
}

export function useRolePermissions(roleId: string) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRolePermissions(roleId);
      setPermissions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch role permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) {
      fetchPermissions();
    }
  }, [roleId]);

  const assignPermission = async (permissionId: string, assignedBy: string) => {
    try {
      await adminApi.assignPermissionToRole(roleId, permissionId, assignedBy);
      await fetchPermissions();
    } catch (err: any) {
      throw err;
    }
  };

  const removePermission = async (permissionId: string, removedBy: string) => {
    try {
      await adminApi.removePermissionFromRole(roleId, permissionId, removedBy);
      await fetchPermissions();
    } catch (err: any) {
      throw err;
    }
  };

  return { permissions, loading, error, assignPermission, removePermission, refetch: fetchPermissions };
}
