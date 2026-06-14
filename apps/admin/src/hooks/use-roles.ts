import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Role } from '@hazel/shared';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRoles();
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, error, refetch: fetchRoles };
}

export function useRole(id: string) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        setLoading(true);
        const data = await adminApi.getRoleById(id);
        setRole(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch role');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchRole();
    }
  }, [id]);

  return { role, loading, error };
}

export function useRoleMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRole = async (roleData: Partial<Role>, createdBy: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.createRole(roleData, createdBy);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, roleData: Partial<Role>, updatedBy: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.updateRole(id, roleData, updatedBy);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id: string, deletedBy: string) => {
    try {
      setLoading(true);
      setError(null);
      await adminApi.deleteRole(id, deletedBy);
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createRole, updateRole, deleteRole, loading, error };
}
