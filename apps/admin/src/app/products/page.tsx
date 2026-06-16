'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@hazel/shared';
import { Loader2, Plus, Trash2, Eye, EyeOff, Star, Search, Upload, X } from 'lucide-react';

// ── Tag-input component for custom sizes / colors ──────────────────────────
function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const val = raw.trim();
    if (!val || tags.includes(val)) { setInputVal(''); return; }
    onChange([...tags, val]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-brand-secondary/70 uppercase block">{label}</label>
      <div
        className="flex flex-wrap gap-2 border rounded p-2 bg-white focus-within:border-brand-primary min-h-[48px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
          placeholder={tags.length === 0 ? (placeholder || 'Type and press Enter…') : ''}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-brand-secondary"
        />
      </div>
      <p className="text-[10px] text-brand-secondary/45 font-semibold">Press Enter or comma to add · Backspace to remove</p>
    </div>
  );
}

// ── Variant Stock Grid ─────────────────────────────────────────────────────
function VariantStockGrid({
  sizes,
  colors,
  variantStock,
  onChange,
}: {
  sizes: string[];
  colors: string[];
  variantStock: Record<string, Record<string, number>>;
  onChange: (vs: Record<string, Record<string, number>>) => void;
}) {
  if (sizes.length === 0 || colors.length === 0) {
    return (
      <p className="text-xs text-brand-secondary/45 italic font-semibold">
        Add sizes and colors above to set per-variant quantities.
      </p>
    );
  }

  const getQty = (size: string, color: string) =>
    variantStock?.[size]?.[color] ?? 0;

  const setQty = (size: string, color: string, qty: number) => {
    const updated = { ...variantStock };
    if (!updated[size]) updated[size] = {};
    updated[size] = { ...updated[size], [color]: Math.max(0, qty) };
    onChange(updated);
  };

  const totalStock = sizes.reduce((sum, s) =>
    sum + colors.reduce((cs, c) => cs + getQty(s, c), 0), 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded border border-brand-primary-light/20">
        <table className="text-xs font-semibold w-full">
          <thead>
            <tr className="bg-brand-primary-cream/50 border-b border-brand-primary-light/20">
              <th className="py-2 px-3 text-left text-brand-secondary/60 uppercase text-[10px]">Size \ Color</th>
              {colors.map(c => (
                <th key={c} className="py-2 px-3 text-center text-brand-secondary/60 uppercase text-[10px] min-w-[80px]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary-light/10">
            {sizes.map(s => (
              <tr key={s} className="hover:bg-zinc-50/60">
                <td className="py-2 px-3 font-bold text-brand-secondary">{s}</td>
                {colors.map(c => (
                  <td key={c} className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={getQty(s, c)}
                      onChange={e => setQty(s, c, Number(e.target.value))}
                      className="w-16 border rounded p-1 text-center text-xs bg-white outline-none focus:border-brand-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs font-bold text-brand-secondary/60">
        Total Stock: <span className="text-brand-primary">{totalStock}</span> units
      </p>
    </div>
  );
}

// ── Main Products Page ─────────────────────────────────────────────────────
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
  const [variantStock, setVariantStock] = useState<Record<string, Record<string, number>>>({});
  const [material, setMaterial] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Recalculate stock_qty whenever variantStock changes
  const calcTotalStock = (vs: Record<string, Record<string, number>>) =>
    Object.values(vs).reduce(
      (sum, colorMap) => sum + Object.values(colorMap).reduce((cs, qty) => cs + qty, 0),
      0
    );

  const openAddModal = () => {
    setCurrentProduct(null);
    setName('');
    setPrice(0);
    setDescription('');
    setSizes([]);
    setColors([]);
    setVariantStock({});
    setMaterial('');
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
    setVariantStock((prod as any).variant_stock || {});
    setMaterial(prod.material || '');
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
      const signRes = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'hazel-clothing/products' }),
      });

      if (!signRes.ok) throw new Error('Failed to get signature.');
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

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

    if (sizes.length === 0 || colors.length === 0) {
      alert('Please add at least one size and one color.');
      setSaving(false);
      return;
    }

    try {
      const totalStock = calcTotalStock(variantStock);
      const payloadWithVariant: any = {
        name,
        price,
        description,
        sizes,
        colors,
        variant_stock: variantStock,
        material,
        stock_qty: totalStock,
        category_id: categoryId || null,
        is_active: isActive,
        is_featured: isFeatured,
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      // Payload without variant_stock (fallback if column not yet added in Supabase)
      const payloadBase: any = {
        name,
        price,
        description,
        sizes,
        colors,
        material,
        stock_qty: totalStock,
        category_id: categoryId || null,
        is_active: isActive,
        is_featured: isFeatured,
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      const trySave = async (payload: any) => {
        if (currentProduct) {
          return supabase.from('products').update(payload).eq('id', currentProduct.id);
        } else {
          return supabase.from('products').insert({ ...payload, created_at: new Date().toISOString(), is_deleted: false });
        }
      };

      // Try saving with variant_stock first
      let { error } = await trySave(payloadWithVariant);

      // If column doesn't exist yet, retry without it
      if (error && (error.message.includes('variant_stock') || error.code === '42703' || error.message.includes('schema cache'))) {
        const retry = await trySave(payloadBase);
        if (retry.error) throw new Error(retry.error.message + '\n\n⚠️ Note: Run this SQL in Supabase to enable per-variant stock:\nALTER TABLE products ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT \'{}\';');
      } else if (error) {
        throw new Error(error.message);
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.material || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6 animate-fade-in text-brand-secondary">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                <th className="py-4 w-16">Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sizes</th>
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
                        <div className="flex flex-wrap gap-1">
                          {(p.sizes || []).slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] bg-brand-primary-light/20 text-brand-primary font-bold px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                          {(p.sizes || []).length > 3 && (
                            <span className="text-[10px] text-brand-secondary/40">+{p.sizes.length - 3}</span>
                          )}
                        </div>
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
                  <td colSpan={9} className="py-12 text-center text-brand-secondary/50 font-bold">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-brand-secondary/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border w-full max-w-3xl rounded shadow-2xl p-8 my-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-brand-secondary">
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded transition"
              >
                <X size={20} className="text-brand-secondary/60" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-sm font-semibold">
              {/* Name & Price */}
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

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary h-24"
                />
              </div>

              {/* Category & Material */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              {/* Custom Sizes Tag Input */}
              <TagInput
                label="Available Sizes * (e.g. S, M, L, XL, 28, 30)"
                tags={sizes}
                onChange={setSizes}
                placeholder="Type a size and press Enter…"
              />

              {/* Custom Colors Tag Input */}
              <TagInput
                label="Available Colors * (e.g. White, Black, Dusty Rose)"
                tags={colors}
                onChange={setColors}
                placeholder="Type a color and press Enter…"
              />

              {/* Variant Stock Grid */}
              <div className="space-y-3 border-t border-brand-primary-light/10 pt-5">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase block">
                  Stock Quantity per Variant (Size × Color)
                </label>
                <VariantStockGrid
                  sizes={sizes}
                  colors={colors}
                  variantStock={variantStock}
                  onChange={setVariantStock}
                />
              </div>

              {/* Image upload row */}
              <div className="space-y-3 border-t border-brand-primary-light/10 pt-5">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Product Images *</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative h-24 w-18 border rounded overflow-hidden bg-gray-50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Uploaded item" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
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
                  <span>New Arrival / Featured</span>
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
                  SAVE PRODUCT
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
