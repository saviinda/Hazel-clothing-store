'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@hazel/shared';
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, Star, Search, Upload } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [material, setMaterial] = useState('');
  const [stockQty, setStockQty] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Constants
  const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', '26', '28', '30', '32'];
  const AVAILABLE_COLORS = ['Soft Blush', 'Dusty Rose', 'White', 'Oatmeal', 'Black', 'Emerald Green', 'Light Wash Denim', 'Dark Wash Denim', 'Mocha Brown'];

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (prodData) setProducts(prodData as unknown as Product[]);
      if (catData) setCategories(catData as Category[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setCurrentProduct(null);
    setName('');
    setPrice(0);
    setDescription('');
    setSizes(['M']);
    setColors(['White']);
    setMaterial('');
    setStockQty(10);
    setCategoryId(categories[0]?.id || '');
    setIsActive(true);
    setIsFeatured(false);
    setImageUrls([]);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setCurrentProduct(prod);
    setName(prod.name);
    setPrice(Number(prod.price));
    setDescription(prod.description || '');
    setSizes(prod.sizes);
    setColors(prod.colors);
    setMaterial(prod.material || '');
    setStockQty(prod.stock_qty);
    setCategoryId(prod.category_id || '');
    setIsActive(prod.is_active);
    setIsFeatured(prod.is_featured);
    setImageUrls(prod.images || []);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. Get signed Cloudinary params
      const signRes = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'hazel-clothing/products' }),
      });

      if (!signRes.ok) throw new Error('Failed to get signature.');
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      // 2. Post file directly to Cloudinary public folder
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', 'hazel-clothing/products');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Image upload failed.');
      const uploadData = await uploadRes.json();
      setImageUrls([...imageUrls, uploadData.secure_url]);
    } catch (err) {
      console.error(err);
      alert('Error uploading image to Cloudinary.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (imageUrls.length === 0) {
      alert('Please upload at least one product image.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        price,
        description,
        sizes,
        colors,
        material,
        stock_qty: stockQty,
        category_id: categoryId || null,
        is_active: isActive,
        is_featured: isFeatured,
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      if (currentProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', currentProduct.id);

        if (error) throw new Error(error.message);
      } else {
        // Create product
        const { error } = await supabase
          .from('products')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
            is_deleted: false,
          });

        if (error) throw new Error(error.message);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prodId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_deleted: true, is_active: false })
        .eq('id', prodId);

      if (error) throw new Error(error.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
    }
  };

  // Filter products by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.material || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6 animate-fade-in text-brand-secondary">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex w-full sm:max-w-xs items-center gap-2 border border-brand-primary-light/35 rounded bg-white p-3 text-sm focus-within:border-brand-primary">
          <Search size={16} className="text-brand-secondary/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full outline-none bg-transparent"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold p-3 px-6 rounded text-xs tracking-wider transition"
        >
          <Plus size={16} />
          ADD PRODUCT
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : (
        /* Table Grid */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                <th className="py-4 w-16">Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Active</th>
                <th>Featured</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary-light/5 font-semibold">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const catName = categories.find((c) => c.id === p.category_id)?.name || 'Unassigned';
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/50">
                      <td className="py-4">
                        <div className="h-12 w-9 rounded overflow-hidden bg-gray-50 border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                      </td>
                      <td>
                        <p className="font-bold">{p.name}</p>
                        <span className="text-[10px] text-brand-secondary/40 uppercase tracking-widest">{p.material}</span>
                      </td>
                      <td>{catName}</td>
                      <td>LKR {Number(p.price).toFixed(2)}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs ${p.stock_qty <= 5 ? 'bg-red-50 text-red-700' : 'text-brand-secondary'}`}>
                          {p.stock_qty}
                        </span>
                      </td>
                      <td>
                        {p.is_active ? (
                          <Eye className="text-green-600" size={18} />
                        ) : (
                          <EyeOff className="text-zinc-300" size={18} />
                        )}
                      </td>
                      <td>
                        {p.is_featured ? (
                          <Star className="text-yellow-500 fill-yellow-500" size={18} />
                        ) : (
                          <Star className="text-zinc-200" size={18} />
                        )}
                      </td>
                      <td className="text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 px-3 text-xs bg-brand-primary-light/20 hover:bg-brand-primary hover:text-white text-brand-primary font-bold rounded transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1 px-3 text-xs bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-brand-secondary/50 font-bold">
                    No products added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/40 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="bg-white border w-full max-w-2xl rounded shadow-2xl p-8 max-h-[85vh] overflow-y-auto space-y-6">
            <h3 className="font-serif text-2xl font-bold text-brand-secondary">
              {currentProduct ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSave} className="space-y-6 text-sm font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-secondary/70 uppercase">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Blush Linen Midi Dress"
                    className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-secondary/70 uppercase">Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-secondary/70 uppercase">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-secondary/70 uppercase">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Linen / Cotton"
                    className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-secondary/70 uppercase">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Sizes Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Available Sizes *</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => {
                    const active = sizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => {
                          if (active) {
                            setSizes(sizes.filter((s) => s !== size));
                          } else {
                            setSizes([...sizes, size]);
                          }
                        }}
                        className={`p-2 px-4 border rounded text-xs font-bold transition ${
                          active 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-white hover:border-brand-primary'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Available Colors *</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((col) => {
                    const active = colors.includes(col);
                    return (
                      <button
                        type="button"
                        key={col}
                        onClick={() => {
                          if (active) {
                            setColors(colors.filter((c) => c !== col));
                          } else {
                            setColors([...colors, col]);
                          }
                        }}
                        className={`p-2 px-4 border rounded text-xs font-bold transition ${
                          active 
                            ? 'bg-brand-primary text-white border-brand-primary' 
                            : 'bg-white hover:border-brand-primary'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image upload row */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Product Images *</label>
                
                <div className="flex flex-wrap gap-4 items-center">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative h-24 w-18 border rounded overflow-hidden bg-gray-50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Uploaded item" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((u, i) => i !== idx))}
                        className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <div className="relative h-24 w-18 border-2 border-dashed border-brand-primary-light/45 rounded flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={20} className="text-brand-primary" />
                    {uploadingImage && <Loader2 className="animate-spin text-brand-primary absolute" size={18} />}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-8 border-t border-brand-primary-light/10 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 accent-brand-primary"
                  />
                  <span>Active & Visible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-brand-primary"
                  />
                  <span>Featured Collection</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 border-t border-brand-primary-light/10 pt-6">
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold h-12 rounded text-xs tracking-wider transition"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  SAVE CHANGES
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold h-12 rounded text-xs tracking-wider transition"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
