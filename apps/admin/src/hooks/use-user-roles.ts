import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

export function useUserRoles(userId: string) {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUserRoles(userId);
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRoles();
    }
  }, [userId]);

  const assignRole = async (roleId: string, assignedBy: string) => {
    try {
      await adminApi.assignRoleToUser(userId, roleId, assignedBy);
      await fetchRoles();
    } catch (err: any) {
      throw err;
    }
  };

  const removeRole = async (roleId: string, removedBy: string) => {
    try {
      await adminApi.removeRoleFromUser(userId, roleId, removedBy);
      await fetchRoles();
    } catch (err: any) {
      throw err;
    }
  };

  return { roles, loading, error, assignRole, removeRole, refetch: fetchRoles };
}
