import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Product } from '@hazel/shared';

export function useAdminProducts(filters?: {
  category_id?: string;
  limit?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getProducts(filters);
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [JSON.stringify(filters)]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useAdminProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await adminApi.getProductById(id);
        setProduct(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return { product, loading, error };
}

export function useProductMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (productData: Partial<Product>, createdBy: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.createProduct(productData, createdBy);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>, updatedBy: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.updateProduct(id, productData, updatedBy);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string, deletedBy: string) => {
    try {
      setLoading(true);
      setError(null);
      await adminApi.deleteProduct(id, deletedBy);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createProduct, updateProduct, deleteProduct, loading, error };
}
