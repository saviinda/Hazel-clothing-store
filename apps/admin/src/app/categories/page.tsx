'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@hazel/shared';
import { Loader2, Plus, Edit2, Trash2, Search, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadCategories = async (silent = false) => {
    if (categories.length === 0 || !silent) {
      setLoading(true);
    } else {
      setRevalidating(true);
    }
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setCategories(data as Category[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Real-time subscription for categories table
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          loadCategories(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openAddModal = () => {
    setCurrentCategory(null);
    setName('');
    setSlug('');
    setParentCategoryId('');
    setImageUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setCurrentCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setParentCategoryId(cat.parent_category_id || '');
    setImageUrl(cat.image_url || '');
    setIsActive(cat.is_active);
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
        body: JSON.stringify({ folder: 'hazel-clothing/categories' }),
      });

      if (!signRes.ok) throw new Error('Signature retrieval failed.');
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', 'hazel-clothing/categories');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Image upload failed.');
      const uploadData = await uploadRes.json();
      setImageUrl(uploadData.secure_url);
    } catch (err) {
      console.error(err);
      toast.error('Error uploading category image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        parent_category_id: parentCategoryId || null,
        image_url: imageUrl || null,
        is_active: isActive,
      };

      if (currentCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', currentCategory.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });

        if (error) throw new Error(error.message);
      }

      setIsModalOpen(false);
      toast.success(currentCategory ? 'Category updated successfully!' : 'Category created successfully!');
      await loadCategories(true);
    } catch (err: any) {
      toast.error(err.message || 'Saving category failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catId: string) => {
    setConfirmDeleteCatId(catId);
  };

  // Filter lists by search
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-6 animate-fade-in text-brand-secondary">
      {/* Top Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex w-full sm:max-w-xs items-center gap-2 border border-brand-primary-light/35 rounded bg-white p-3 text-sm focus-within:border-brand-primary">
          <Search size={16} className="text-brand-secondary/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full outline-none bg-transparent"
          />
        </div>

        {/* Action button */}
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold p-3 px-6 rounded text-xs tracking-wider transition"
        >
          <Plus size={16} />
          ADD CATEGORY
        </button>
      </div>

      {/* Grid Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : (
        <div className={`overflow-x-auto -mx-6 px-6 transition-opacity duration-200 relative ${revalidating ? 'opacity-60 pointer-events-none' : ''}`}>
          {revalidating && (
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] flex items-center justify-center z-10 rounded">
              <Loader2 className="animate-spin text-brand-primary" size={24} />
            </div>
          )}
          <div className="min-w-[700px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase">
                  <th className="py-4 px-2 w-16">Image</th>
                  <th className="px-2">Category Name</th>
                  <th className="px-2">Slug</th>
                  <th className="px-2">Type</th>
                  <th className="px-2">Visibility</th>
                  <th className="px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary-light/5 font-semibold">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((c) => {
                    const parentName = categories.find((pc) => pc.id === c.parent_category_id)?.name;
                    return (
                      <tr key={c.id} className="hover:bg-zinc-50/50">
                        <td className="py-4 px-2">
                          <div className="h-10 w-10 rounded overflow-hidden bg-gray-50 border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.image_url || '/placeholder.jpg'} alt={c.name} className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="px-2 font-bold">{c.name}</td>
                        <td className="px-2 font-mono text-xs">{c.slug}</td>
                        <td className="px-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            parentName ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {parentName ? `Subcategory (of ${parentName})` : 'Parent Category'}
                          </span>
                        </td>
                        <td className="px-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            c.is_active ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-800'
                          }`}>
                            {c.is_active ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-2 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1 px-3 text-xs bg-brand-primary-light/20 hover:bg-brand-primary hover:text-white text-brand-primary font-bold rounded transition"
                          >
                            Edit
                          </button>
                        <button
                          onClick={() => handleDelete(c.id)}
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
                  <td colSpan={6} className="py-12 text-center text-brand-secondary/50 font-bold">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
              </div>
            </div>
      )}

      {/* Pop-up Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/40 backdrop-blur-sm p-6">
          <div className="bg-white border w-full max-w-md rounded shadow-2xl p-8 space-y-6">
            <h3 className="font-serif text-xl font-bold text-brand-secondary">
              {currentCategory ? 'Edit Category' : 'Add Category'}
            </h3>

            <form onSubmit={handleSave} className="space-y-5 text-sm font-semibold">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!currentCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                    }
                  }}
                  placeholder="e.g. Dresses"
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Slug Path *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. dresses"
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase">Parent Category (Optional)</label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value="">None (Top Level Category)</option>
                  {categories
                    .filter((c) => !c.parent_category_id && c.id !== currentCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              {/* Image upload preview */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-brand-secondary/70 uppercase block">Banner Image</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 border rounded overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="Category preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-zinc-300">No image</span>
                    )}
                  </div>
                  <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-3 flex-1 flex items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 font-bold">
                      <Upload size={14} className="text-brand-primary" />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <label className="flex items-center gap-2 cursor-pointer border-t border-brand-primary-light/10 pt-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-brand-primary"
                />
                <span>Visible in navigation shop filters</span>
              </label>

              {/* Actions */}
              <div className="flex gap-4 border-t border-brand-primary-light/10 pt-4">
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold h-12 rounded text-xs tracking-wider transition"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  SAVE
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteCatId !== null}
        title="Delete Category"
        message="Are you sure you want to delete this category? All subcategories might be affected."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          if (!confirmDeleteCatId) return;
          const catId = confirmDeleteCatId;
          setConfirmDeleteCatId(null);
          try {
            const { error } = await supabase
              .from('categories')
              .delete()
              .eq('id', catId);

            if (error) throw new Error(error.message);
            toast.success('Category deleted successfully!');
            await loadCategories(true);
          } catch (err: any) {
            toast.error(err.message || 'Delete category failed.');
          }
        }}
        onCancel={() => setConfirmDeleteCatId(null)}
      />
    </div>
  );
}
