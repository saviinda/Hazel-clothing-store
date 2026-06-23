'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Upload, Plus, Trash2, Star, StarOff, Image as ImageIcon, Video, Play, Pause, Eye, EyeOff, Edit } from 'lucide-react';

type Tab = 'new_arrivals' | 'hero' | 'testimonials' | 'size_guide' | 'video_feed';

export default function ContentManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('new_arrivals');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── New Arrivals (featured products) ──
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // ── Hero Banner ──
  const [heroTitle, setHeroTitle] = useState('EMBRACE YOUR UNIQUE STYLE');
  const [heroSubtitle, setHeroSubtitle] = useState('Discover modern silhouettes and feminine tones designed for you.');
  const [heroCtaText, setHeroCtaText] = useState('SHOP NEW ARRIVALS');
  const [heroCtaLink, setHeroCtaLink] = useState('/shop');
  const [heroImageUrl, setHeroImageUrl] = useState('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80');
  const [heroMobileImages, setHeroMobileImages] = useState<string[]>([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMobileHero, setUploadingMobileHero] = useState(false);

  // ── Testimonials ──
  const [reviews, setReviews] = useState<any[]>([
    { name: 'Shenali D.', comment: 'Absolutely love the Linen Midi Dress! The fabric is perfect for Colombo weather and the fit is spot on.', rating: 5 },
    { name: 'Ishini W.', comment: 'Bought the Mom Jeans and White Crop Top. Both look exactly like the photos on their Instagram. Shipping was super fast!', rating: 5 },
    { name: 'Sanduni P.', comment: 'Order procedure was very easy. Just uploaded my bank receipt and order status updated on the tracking link in 1 hour.', rating: 5 },
  ]);

  // ── Size Guide ──
  const [sizeGuideImages, setSizeGuideImages] = useState<Record<string, string>>({});
  const [uploadingSizeGuide, setUploadingSizeGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);

  // ── Video Feed ──
  const [videos, setVideos] = useState<any[]>([]);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [videoIsEnabled, setVideoIsEnabled] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingVideoThumb, setUploadingVideoThumb] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all active products for New Arrivals management
      const { data: prodData } = await supabase
        .from('products')
        .select('id, name, images, price, is_featured, is_active, sizes, colors, category_id')
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodData) setAllProducts(prodData);

      // Load all categories
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (catData) setCategories(catData);

      // Load content sections
      const { data: contentData } = await supabase.from('content').select('*');
      if (contentData) {
        const hero = contentData.find(c => c.section_key === 'hero_banner');
        if (hero?.data) {
          setHeroTitle(hero.data.title || '');
          setHeroSubtitle(hero.data.subtitle || '');
          setHeroCtaText(hero.data.cta_text || '');
          setHeroCtaLink(hero.data.cta_link || '');
          setHeroImageUrl(hero.data.image_url || '');
          setHeroMobileImages(Array.isArray(hero.data.mobile_image_urls) ? hero.data.mobile_image_urls : []);
        }

        const tests = contentData.find(c => c.section_key === 'testimonials');
        if (tests?.data?.reviews) setReviews(tests.data.reviews);

        const sizeGuide = contentData.find(c => c.section_key === 'size_guide');
        if (sizeGuide?.data?.images) setSizeGuideImages(sizeGuide.data.images);

        const vFeed = contentData.find(c => c.section_key === 'video_feed');
        if (vFeed?.data?.videos) setVideos(vFeed.data.videos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Toggle product featured status ──
  const toggleFeatured = async (productId: string, currentVal: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !currentVal, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      // Update local state immediately
      setAllProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, is_featured: !currentVal } : p)
      );

      const userId = (await supabase.auth.getUser()).data.user?.id || null;
      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: !currentVal ? 'mark_new_arrival' : 'unmark_new_arrival',
        module: 'content',
        detail: { product_id: productId }
      });
    } catch (err: any) {
      alert('Failed to update featured status: ' + err.message);
    }
  };

  // ── Hero image upload ──
  const uploadHeroImage = async (file: File) => {
    const signRes = await fetch('/api/v1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'hazel-clothing/banners' }),
    });
    if (!signRes.ok) throw new Error('Signature retrieval failed.');
    const { signature, timestamp, apiKey, cloudName } = await signRes.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('folder', 'hazel-clothing/banners');

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!uploadRes.ok) throw new Error('Image upload failed.');
    const uploadData = await uploadRes.json();
    return uploadData.secure_url as string;
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      setHeroImageUrl(await uploadHeroImage(file));
    } catch (err) {
      alert('Error uploading hero banner image.');
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleMobileHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobileHero(true);
    try {
      const url = await uploadHeroImage(file);
      setHeroMobileImages(prev => [...prev, url]);
    } catch (err) {
      alert('Error uploading mobile banner image.');
    } finally {
      setUploadingMobileHero(false);
      e.target.value = '';
    }
  };

  const removeMobileHeroImage = (index: number) => {
    setHeroMobileImages(prev => prev.filter((_, i) => i !== index));
  };

  // ── Save Hero ──
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const heroPayload = {
        title: heroTitle,
        subtitle: heroSubtitle,
        cta_text: heroCtaText,
        cta_link: heroCtaLink,
        image_url: heroImageUrl,
        mobile_image_urls: heroMobileImages,
      };
      const userId = (await supabase.auth.getUser()).data.user?.id || null;
      const { error } = await supabase.from('content').upsert(
        { section_key: 'hero_banner', data: heroPayload, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: 'section_key' }
      );
      if (error) throw new Error(error.message);
      await supabase.from('audit_logs').insert({ admin_id: userId, action: 'edit_hero_banner', module: 'content', detail: heroPayload });
      alert('Hero Banner updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving banner failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Save Testimonials ──
  const handleSaveTestimonials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id || null;
      const { error } = await supabase.from('content').upsert(
        { section_key: 'testimonials', data: { reviews }, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: 'section_key' }
      );
      if (error) throw new Error(error.message);
      await supabase.from('audit_logs').insert({ admin_id: userId, action: 'edit_testimonials', module: 'content', detail: { reviews_count: reviews.length } });
      alert('Customer reviews updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving reviews failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReview = () => setReviews([...reviews, { name: 'New Client', comment: 'Review comment goes here...', rating: 5 }]);
  const handleRemoveReview = (idx: number) => setReviews(reviews.filter((_, i) => i !== idx));
  const handleReviewChange = (idx: number, field: string, value: any) => {
    const updated = [...reviews];
    updated[idx][field] = value;
    setReviews(updated);
  };

  // ── Size Guide upload ──
  const handleSizeGuideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;
    setUploadingSizeGuide(true);
    try {
      const url = await uploadHeroImage(file);
      setSizeGuideImages(prev => ({ ...prev, [selectedCategory]: url }));
    } catch (err) {
      alert('Error uploading size guide image.');
    } finally {
      setUploadingSizeGuide(false);
      e.target.value = '';
    }
  };

  // ── Save Size Guide ──
  const handleSaveSizeGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id || null;
      const { error } = await supabase.from('content').upsert(
        { section_key: 'size_guide', data: { images: sizeGuideImages }, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: 'section_key' }
      );
      if (error) throw new Error(error.message);
      await supabase.from('audit_logs').insert({ admin_id: userId, action: 'edit_size_guide', module: 'content', detail: { categories_count: Object.keys(sizeGuideImages).length } });
      alert('Size Guide updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving size guide failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Video Feed CRUD Operations ──

  const saveVideos = async (videoList: any[]) => {
    setSaving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id || null;
      const { error } = await supabase.from('content').upsert(
        { section_key: 'video_feed', data: { videos: videoList }, updated_at: new Date().toISOString(), updated_by: userId },
        { onConflict: 'section_key' }
      );
      if (error) throw new Error(error.message);
      await supabase.from('audit_logs').insert({ admin_id: userId, action: 'edit_video_feed', module: 'content', detail: { videos_count: videoList.length } });
    } catch (err: any) {
      alert('Failed to save video changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const signRes = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'hazel-clothing/videos' }),
      });
      if (!signRes.ok) throw new Error('Signature retrieval failed.');
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', 'hazel-clothing/videos');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Video upload failed.');
      const uploadData = await uploadRes.json();
      setVideoUrl(uploadData.secure_url);
      
      // Auto generate a matching thumbnail url by default if none is set
      if (!videoThumbnailUrl) {
        const autoThumb = uploadData.secure_url.replace(/\.[^/.]+$/, '') + '.jpg';
        setVideoThumbnailUrl(autoThumb);
      }
    } catch (err: any) {
      alert('Error uploading video: ' + err.message);
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleVideoThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideoThumb(true);
    try {
      const url = await uploadHeroImage(file);
      setVideoThumbnailUrl(url);
    } catch (err: any) {
      alert('Error uploading thumbnail: ' + err.message);
    } finally {
      setUploadingVideoThumb(false);
      e.target.value = '';
    }
  };

  const toggleVideoEnabled = async (idx: number) => {
    const updated = [...videos];
    updated[idx].is_enabled = !updated[idx].is_enabled;
    setVideos(updated);
    await saveVideos(updated);
  };

  const handleOpenAddVideo = () => {
    setEditingVideoIndex(null);
    setVideoTitle('');
    setVideoUrl('');
    setVideoThumbnailUrl('');
    setVideoIsEnabled(true);
    setIsEditingVideo(true);
  };

  const handleOpenEditVideo = (idx: number) => {
    const v = videos[idx];
    setEditingVideoIndex(idx);
    setVideoTitle(v.title || '');
    setVideoUrl(v.video_url || '');
    setVideoThumbnailUrl(v.thumbnail_url || '');
    setVideoIsEnabled(v.is_enabled !== false);
    setIsEditingVideo(true);
  };

  const handleSaveVideoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !videoTitle) {
      alert('Please fill in a title and upload a video.');
      return;
    }

    const videoItem = {
      id: editingVideoIndex !== null ? videos[editingVideoIndex].id : crypto.randomUUID(),
      title: videoTitle,
      video_url: videoUrl,
      thumbnail_url: videoThumbnailUrl,
      is_enabled: videoIsEnabled,
      created_at: editingVideoIndex !== null ? videos[editingVideoIndex].created_at : new Date().toISOString()
    };

    let updated = [...videos];
    if (editingVideoIndex !== null) {
      updated[editingVideoIndex] = videoItem;
    } else {
      updated.push(videoItem);
    }

    setVideos(updated);
    setIsEditingVideo(false);
    await saveVideos(updated);
    alert('Video saved successfully!');
  };

  const handleDeleteVideo = async (idx: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    const updated = videos.filter((_, i) => i !== idx);
    setVideos(updated);
    await saveVideos(updated);
    alert('Video deleted successfully!');
  };

  const featuredProducts = allProducts.filter(p => p.is_featured);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-brand-secondary">
      {/* Tabs */}
      <div className="scroll-tabs border-b border-brand-primary-light/15">
        {([
          { key: 'new_arrivals', label: 'NEW ARRIVALS', icon: Star },
          { key: 'hero', label: 'HERO BANNER', icon: ImageIcon },
          { key: 'testimonials', label: 'TESTIMONIALS', icon: Save },
          { key: 'size_guide', label: 'SIZE GUIDE', icon: ImageIcon },
          { key: 'video_feed', label: 'STYLE INSPIRATION', icon: Video },
        ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition ${
              activeTab === key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-secondary/60 hover:text-brand-primary'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: New Arrivals ── */}
      {activeTab === 'new_arrivals' && (
        <div className="space-y-6">
          {/* Summary banner */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-brand-primary/5 border border-brand-primary/15 rounded p-4">
            <div>
              <h4 className="font-serif text-lg font-bold">New Arrivals on Homepage</h4>
              <p className="text-xs text-brand-secondary/60 font-semibold mt-1">
                Toggle the ★ star on any product to show or hide it in the "Trending New Arrivals" section on the homepage.
                Currently <span className="text-brand-primary">{featuredProducts.length}</span> product(s) featured.
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-brand-secondary/60">
              <p>Max shown: <span className="text-brand-primary font-bold">8</span></p>
            </div>
          </div>

          <div className="bg-white border border-brand-primary-light/10 rounded shadow-sm">
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[600px]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-brand-primary-light/10 text-xs font-bold text-brand-secondary/45 uppercase bg-zinc-50/50">
                      <th className="py-3 px-2">Image</th>
                      <th className="py-3 px-2">Product</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2">Sizes</th>
                      <th className="py-3 px-2 text-center">New Arrival</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-primary-light/5">
                    {allProducts.length > 0 ? allProducts.map(p => (
                      <tr key={p.id} className={`hover:bg-zinc-50/50 transition ${p.is_featured ? 'bg-yellow-50/30' : ''}`}>
                        <td className="py-3 px-2">
                          <div className="h-12 w-9 rounded overflow-hidden bg-gray-50 border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-bold">{p.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(p.colors || []).slice(0, 3).map((c: string) => (
                              <span key={c} className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">{c}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-semibold">LKR {Number(p.price).toFixed(2)}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {(p.sizes || []).map((s: string) => (
                              <span key={s} className="text-[10px] bg-brand-primary-light/20 text-brand-primary font-bold px-1.5 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => toggleFeatured(p.id, p.is_featured)}
                            title={p.is_featured ? 'Remove from New Arrivals' : 'Add to New Arrivals'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${
                              p.is_featured
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                                : 'bg-zinc-100 text-zinc-500 hover:bg-brand-primary hover:text-white border border-zinc-200'
                            }`}
                      >
                        {p.is_featured ? (
                          <><Star size={13} className="fill-yellow-500 text-yellow-500" /> Featured</>
                        ) : (
                          <><StarOff size={13} /> Add</>
                        )}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-brand-secondary/50 font-bold">
                      No active products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Hero Banner ── */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveHero} className="max-w-2xl bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
          <h4 className="font-serif text-lg font-bold">Edit Homepage Hero Banner</h4>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Headline Text *</label>
            <input type="text" required value={heroTitle} onChange={e => setHeroTitle(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold" />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">Subtitle Caption *</label>
            <textarea required value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold h-20" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-brand-secondary/65 uppercase">CTA Button Text *</label>
              <input type="text" required value={heroCtaText} onChange={e => setHeroCtaText(e.target.value)}
                className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="text-brand-secondary/65 uppercase">CTA Button Link *</label>
              <input type="text" required value={heroCtaLink} onChange={e => setHeroCtaLink(e.target.value)}
                className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-brand-secondary/65 uppercase block">Desktop Banner Image</label>
            <p className="text-[10px] text-brand-secondary/50 font-semibold normal-case">Shown on tablets and desktop (640px and wider).</p>
            <div className="flex items-center gap-4">
              <div className="h-24 w-40 border rounded overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                {heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImageUrl} alt="Hero preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-zinc-300">No image</span>
                )}
              </div>
              <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-6 flex-1 flex flex-col items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer">
                <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload size={18} className="text-brand-primary mb-1" />
                <span className="font-bold">{uploadingHero ? 'Uploading...' : 'Upload Desktop Image (1920×800)'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-brand-secondary/65 uppercase block">Mobile Banner Carousel</label>
            <p className="text-[10px] text-brand-secondary/50 font-semibold normal-case">
              Add 2 or more images for an auto-sliding carousel on phones. Swipe left/right to change slides. If empty, the desktop image is used on mobile.
            </p>

            {heroMobileImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {heroMobileImages.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative group border rounded overflow-hidden bg-gray-50 aspect-[4/5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Mobile slide ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMobileHeroImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      Slide {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-6 flex flex-col items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input type="file" accept="image/*" onChange={handleMobileHeroImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Plus size={18} className="text-brand-primary mb-1" />
              <span className="font-bold">{uploadingMobileHero ? 'Uploading...' : 'Add Mobile Carousel Image (1080×1350)'}</span>
            </div>
          </div>

          <button type="submit" disabled={saving || uploadingHero || uploadingMobileHero}
            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition">
            {saving && <Loader2 className="animate-spin" size={14} />}
            <Save size={16} /> SAVE HERO CONFIG
          </button>
        </form>
      )}

      {/* ── Tab: Testimonials ── */}
      {activeTab === 'testimonials' && (
        <form onSubmit={handleSaveTestimonials} className="max-w-2xl bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-lg font-bold">Customer Testimonials CMS</h4>
            <button type="button" onClick={handleAddReview}
              className="flex items-center gap-1 bg-brand-primary-light/25 p-2 px-3 hover:bg-brand-primary hover:text-white rounded text-brand-primary transition">
              <Plus size={14} /> Add Review
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {reviews.map((r, idx) => (
              <div key={idx} className="p-4 border border-brand-primary-light/20 bg-zinc-50/50 rounded space-y-3 relative group">
                <button type="button" onClick={() => handleRemoveReview(idx)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] text-brand-secondary/60 block uppercase">Client Name</label>
                    <input type="text" required value={r.name} onChange={e => handleReviewChange(idx, 'name', e.target.value)}
                      className="w-full border rounded p-2 bg-white outline-none focus:border-brand-primary text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-secondary/60 block uppercase">Rating (1-5)</label>
                    <input type="number" min={1} max={5} required value={r.rating} onChange={e => handleReviewChange(idx, 'rating', Number(e.target.value))}
                      className="w-full border rounded p-2 bg-white outline-none focus:border-brand-primary text-xs font-semibold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-brand-secondary/60 block uppercase">Review Comment</label>
                  <textarea required value={r.comment} onChange={e => handleReviewChange(idx, 'comment', e.target.value)}
                    className="w-full border rounded p-2 bg-white outline-none focus:border-brand-primary text-xs font-semibold h-16" />
                </div>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving}
            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition">
            {saving && <Loader2 className="animate-spin" size={14} />}
            <Save size={16} /> SAVE TESTIMONIALS
          </button>
        </form>
      )}

      {/* ── Tab: Size Guide ── */}
      {activeTab === 'size_guide' && (
        <form onSubmit={handleSaveSizeGuide} className="max-w-2xl bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
          <h4 className="font-serif text-lg font-bold">Category-wise Size Guide Images</h4>
          <p className="text-[10px] text-brand-secondary/50 font-semibold normal-case">
            Upload size guide charts for each product category. These will be displayed when customers click the "Size Guide" button on product pages.
          </p>

          <div className="space-y-2">
            <label className="text-brand-secondary/65 uppercase block">Select Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary cursor-pointer text-sm font-semibold"
            >
              <option value="">-- Select a category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div className="space-y-2">
              <label className="text-brand-secondary/65 uppercase block">
                Size Guide Image for {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
              </label>
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 border rounded overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                  {sizeGuideImages[selectedCategory] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sizeGuideImages[selectedCategory]} alt="Size Guide preview" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-zinc-300">No image</span>
                  )}
                </div>
                <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-6 flex-1 flex flex-col items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleSizeGuideImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={18} className="text-brand-primary mb-1" />
                  <span className="font-bold">{uploadingSizeGuide ? 'Uploading...' : 'Upload Size Guide Image'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-brand-secondary/65 uppercase block">Uploaded Size Guides</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(sizeGuideImages).map(([category, url]) => (
                <div key={category} className="relative border rounded overflow-hidden bg-gray-50 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Size guide for ${categories.find(c => c.id === category)?.name || category}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSizeGuideImages(prev => {
                      const updated = { ...prev };
                      delete updated[category];
                      return updated;
                    })}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    title="Remove image"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                    {categories.find(c => c.id === category)?.name || category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving || uploadingSizeGuide}
            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition">
            {saving && <Loader2 className="animate-spin" size={14} />}
            <Save size={16} /> SAVE SIZE GUIDES
          </button>
        </form>
      )}

      {/* ── Tab: Video Feed ── */}
      {activeTab === 'video_feed' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-brand-primary/5 border border-brand-primary/15 rounded p-4">
            <div>
              <h4 className="font-serif text-lg font-bold">Homepage Style Inspiration Feed</h4>
              <p className="text-xs text-brand-secondary/60 font-semibold mt-1">
                Upload vertical short videos (portrait/Reels aspect ratio) to show in the "Style Inspiration" swipeable feed near the bottom of the home page.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleOpenAddVideo}
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs tracking-wider px-4 py-2.5 rounded transition shadow-sm cursor-pointer"
              >
                <Plus size={14} /> ADD NEW VIDEO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.length > 0 ? (
              videos.map((v, idx) => (
                <div key={v.id || idx} className={`bg-white border rounded shadow-sm overflow-hidden flex flex-col group relative ${!v.is_enabled ? 'opacity-65' : ''}`}>
                  {/* Video Thumbnail / Preview */}
                  <div className="aspect-[9/16] bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    {v.video_url ? (
                      <video
                        src={v.video_url}
                        poster={v.thumbnail_url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <span className="text-xs text-zinc-500">No Video Url</span>
                    )}

                    {/* Quick Badge */}
                    <div className="absolute top-3 left-3 z-10 flex gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded shadow ${v.is_enabled ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'}`}>
                        {v.is_enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="font-bold text-sm tracking-wide line-clamp-1">{v.title}</h5>
                      <p className="text-[10px] text-brand-secondary/45 font-semibold uppercase mt-1 truncate">
                        URL: {v.video_url}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => toggleVideoEnabled(idx)}
                        className={`flex items-center gap-1 text-xs font-bold transition cursor-pointer ${v.is_enabled ? 'text-zinc-500 hover:text-brand-primary' : 'text-brand-primary hover:text-brand-secondary'}`}
                        title={v.is_enabled ? 'Disable video' : 'Enable video'}
                      >
                        {v.is_enabled ? (
                          <><EyeOff size={14} /> Disable</>
                        ) : (
                          <><Eye size={14} /> Enable</>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditVideo(idx)}
                          className="p-1.5 text-zinc-500 hover:text-brand-primary transition cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 transition cursor-pointer"
                          title="Delete Video"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border rounded py-16 text-center text-zinc-400 font-serif text-lg italic">
                No videos configured. Click "ADD NEW VIDEO" above to build your lookbook feed!
              </div>
            )}
          </div>

          {/* Save/Submit Button for order/enable bulk states */}
          {videos.length > 0 && (
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => saveVideos(videos)}
                disabled={saving}
                className="flex items-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest px-8 py-3.5 rounded transition cursor-pointer"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}
                <Save size={16} /> SAVE VIDEO FEED CONFIG
              </button>
            </div>
          )}

          {/* Edit/Add Video Overlay Modal */}
          {isEditingVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white border w-full max-w-xl rounded shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-fade-in text-xs font-bold">
                <div className="flex items-center justify-between border-b pb-4">
                  <h4 className="font-serif text-lg font-bold">
                    {editingVideoIndex !== null ? 'Edit Video Details' : 'Add New Lookbook Video'}
                  </h4>
                  <button type="button" onClick={() => setIsEditingVideo(false)} className="text-zinc-400 hover:text-zinc-600 font-bold text-sm cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleSaveVideoItem} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-brand-secondary/65 uppercase">Video Title *</label>
                    <input
                      type="text"
                      required
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="e.g. Sage Green Autumn Maxi Dress"
                      className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-brand-secondary/65 uppercase block">Video Source (MP4) *</label>
                    <p className="text-[10px] text-brand-secondary/50 font-semibold normal-case">Upload video in vertical aspect ratio (9:16).</p>
                    <div className="flex items-center gap-4">
                      {videoUrl && (
                        <div className="h-32 w-20 border rounded overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                          <video src={videoUrl} className="h-full w-full object-cover" muted playsInline autoPlay loop />
                        </div>
                      )}
                      <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-6 flex-1 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Video size={18} className="text-brand-primary mb-1" />
                        <span className="font-bold">{uploadingVideo ? 'Uploading video...' : 'Upload Video File (.mp4)'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-brand-secondary/65 uppercase block">Cover Thumbnail Image (Optional)</label>
                    <p className="text-[10px] text-brand-secondary/50 font-semibold normal-case">
                      Shown before the video plays. If omitted, Cloudinary generates a fallback frame from the video.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-32 w-24 border rounded overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                        {videoThumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={videoThumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-zinc-300">No Image</span>
                        )}
                      </div>
                      <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-6 flex-1 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleVideoThumbUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload size={18} className="text-brand-primary mb-1" />
                        <span className="font-bold">{uploadingVideoThumb ? 'Uploading thumbnail...' : 'Upload Custom Thumbnail'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-2 border-y border-zinc-100">
                    <input
                      type="checkbox"
                      id="videoEnabled"
                      checked={videoIsEnabled}
                      onChange={(e) => setVideoIsEnabled(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                    <label htmlFor="videoEnabled" className="text-xs text-brand-secondary font-bold select-none cursor-pointer">
                      Enable Video (visible in lookbook feed)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingVideo(false)}
                      className="px-6 h-11 border border-zinc-300 rounded font-bold hover:bg-zinc-50 transition cursor-pointer"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploadingVideo || uploadingVideoThumb}
                      className="px-8 h-11 bg-brand-secondary hover:bg-brand-primary text-white rounded font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {saving && <Loader2 className="animate-spin" size={12} />}
                      CONFIRM LOOK
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
