'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Upload, Plus, Trash2 } from 'lucide-react';

export default function ContentManagerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Hero Banner Form State
  const [heroTitle, setHeroTitle] = useState('EMBRACE YOUR UNIQUE STYLE');
  const [heroSubtitle, setHeroSubtitle] = useState('Discover modern silhouettes and feminine tones designed for you.');
  const [heroCtaText, setHeroCtaText] = useState('SHOP NEW ARRIVALS');
  const [heroCtaLink, setHeroCtaLink] = useState('/shop');
  const [heroImageUrl, setHeroImageUrl] = useState('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80');
  const [uploadingHero, setUploadingHero] = useState(false);

  // Testimonials list
  const [reviews, setReviews] = useState<any[]>([
    { name: 'Shenali D.', comment: 'Absolutely love the Linen Midi Dress! The fabric is perfect for Colombo weather and the fit is spot on.', rating: 5 },
    { name: 'Ishini W.', comment: 'Bought the Mom Jeans and White Crop Top. Both look exactly like the photos on their Instagram. Shipping was super fast!', rating: 5 },
    { name: 'Sanduni P.', comment: 'Order procedure was very easy. Just uploaded my bank receipt and order status updated on the tracking link in 1 hour.', rating: 5 }
  ]);

  const loadContentData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('content').select('*');
      if (data && data.length > 0) {
        const hero = data.find(c => c.section_key === 'hero_banner');
        if (hero) {
          setHeroTitle(hero.data.title || '');
          setHeroSubtitle(hero.data.subtitle || '');
          setHeroCtaText(hero.data.cta_text || '');
          setHeroCtaLink(hero.data.cta_link || '');
          setHeroImageUrl(hero.data.image_url || '');
        }

        const tests = data.find(c => c.section_key === 'testimonials');
        if (tests && tests.data.reviews) {
          setReviews(tests.data.reviews);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContentData();
  }, []);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
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
      setHeroImageUrl(uploadData.secure_url);
    } catch (err) {
      console.error(err);
      alert('Error uploading hero banner image.');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const heroPayload = {
        title: heroTitle,
        subtitle: heroSubtitle,
        cta_text: heroCtaText,
        cta_link: heroCtaLink,
        image_url: heroImageUrl
      };

      const userId = (await supabase.auth.getUser()).data.user?.id || null;

      // Upsert into content table
      const { error } = await supabase
        .from('content')
        .upsert({
          section_key: 'hero_banner',
          data: heroPayload,
          updated_at: new Date().toISOString(),
          updated_by: userId
        }, { onConflict: 'section_key' });

      if (error) throw new Error(error.message);

      // Log action
      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: 'edit_hero_banner',
        module: 'content',
        detail: heroPayload
      });

      alert('Hero Banner updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving banner failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTestimonials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id || null;

      const { error } = await supabase
        .from('content')
        .upsert({
          section_key: 'testimonials',
          data: { reviews },
          updated_at: new Date().toISOString(),
          updated_by: userId
        }, { onConflict: 'section_key' });

      if (error) throw new Error(error.message);

      // Log action
      await supabase.from('audit_logs').insert({
        admin_id: userId,
        action: 'edit_testimonials',
        module: 'content',
        detail: { reviews_count: reviews.length }
      });

      alert('Customer reviews updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Saving reviews failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReview = () => {
    setReviews([...reviews, { name: 'New Client', comment: 'Review comment goes here...', rating: 5 }]);
  };

  const handleRemoveReview = (index: number) => {
    setReviews(reviews.filter((_, idx) => idx !== index));
  };

  const handleReviewChange = (index: number, field: string, value: any) => {
    const updated = [...reviews];
    updated[index][field] = value;
    setReviews(updated);
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-brand-secondary">
      {/* Hero Banner Editor Form */}
      <form onSubmit={handleSaveHero} className="lg:col-span-6 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
        <h4 className="font-serif text-lg font-bold">Edit Homepage Hero Banner</h4>
        
        <div className="space-y-1">
          <label className="text-brand-secondary/65 uppercase">Headline Text *</label>
          <input
            type="text"
            required
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-brand-secondary/65 uppercase">Subtitle Caption *</label>
          <textarea
            required
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold h-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">CTA Button Text *</label>
            <input
              type="text"
              required
              value={heroCtaText}
              onChange={(e) => setHeroCtaText(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-brand-secondary/65 uppercase">CTA Button Link *</label>
            <input
              type="text"
              required
              value={heroCtaLink}
              onChange={(e) => setHeroCtaLink(e.target.value)}
              className="w-full border rounded p-3 bg-white outline-none focus:border-brand-primary text-sm font-semibold"
            />
          </div>
        </div>

        {/* Hero Background image upload */}
        <div className="space-y-2">
          <label className="text-brand-secondary/65 uppercase block">Banner Image Background</label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-40 border rounded overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImageUrl} alt="Hero banner background preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-zinc-300">No image</span>
              )}
            </div>
            
            <div className="relative border-2 border-dashed border-brand-primary-light/45 rounded p-6 flex-1 flex flex-col items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload size={18} className="text-brand-primary mb-1" />
              <span className="font-bold">{uploadingHero ? 'Uploading...' : 'Upload Image (1920x800)'}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || uploadingHero}
          className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition"
        >
          <Save size={16} />
          SAVE HERO CONFIG
        </button>
      </form>

      {/* Customer Reviews Editor */}
      <form onSubmit={handleSaveTestimonials} className="lg:col-span-6 bg-white p-6 border border-brand-primary-light/10 rounded shadow-sm space-y-5 text-xs font-bold">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-lg font-bold">Customer Testimonials CMS</h4>
          <button
            type="button"
            onClick={handleAddReview}
            className="flex items-center gap-1 bg-brand-primary-light/25 p-2 px-3 hover:bg-brand-primary hover:text-white rounded text-brand-primary transition"
          >
            <Plus size={14} /> Add Review
          </button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {reviews.map((r, idx) => (
            <div key={idx} className="p-4 border border-brand-primary-light/20 bg-zinc-50/50 rounded space-y-3 relative group">
              <button
                type="button"
                onClick={() => handleRemoveReview(idx)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-brand-secondary/60 block uppercase">Client Name</label>
                  <input
                    type="text"
                    required
                    value={r.name}
                    onChange={(e) => handleReviewChange(idx, 'name', e.target.value)}
                    className="w-full border rounded p-2 bg-white outline-none focus:border-brand-primary text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-brand-secondary/60 block uppercase">Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    value={r.rating}
                    onChange={(e) => handleReviewChange(idx, 'rating', Number(e.target.value))}
                    className="w-full border rounded p-2 bg-white outline-none focus:border-brand-primary text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-secondary/60 block uppercase">Review Comment</label>
                <textarea
                  required
                  value={r.comment}
                  onChange={(e) => handleReviewChange(idx, 'comment', e.target.value)}
                  className="w-full border rounded p-2 bg-white outline-none focus:border-brand-primary text-xs font-semibold h-16"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-bold text-xs tracking-widest rounded transition"
        >
          <Save size={16} />
          SAVE TESTIMONIALS
        </button>
      </form>
    </div>
  );
}
