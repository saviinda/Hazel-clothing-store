import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Order } from '@hazel/shared';

export function useAdminOrders(filters?: {
  order_status?: string;
  payment_status?: string;
  limit?: number;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrders(filters);
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [JSON.stringify(filters)]);

  return { orders, loading, error, refetch: fetchOrders };
}

export function useAdminOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await adminApi.getOrderById(id);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchOrder();
    }
  }, [id]);

  return { order, loading, error };
}

export function useOrderMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrderStatus = async (
    id: string,
    orderStatus: string,
    paymentStatus?: string,
    updatedBy?: string,
    reason?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.updateOrderStatus(id, orderStatus, paymentStatus, updatedBy, reason);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderShipping = async (id: string, courier: string, trackingNumber: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.updateOrderShipping(id, courier, trackingNumber);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update order shipping');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateOrderStatus, updateOrderShipping, loading, error };
}
