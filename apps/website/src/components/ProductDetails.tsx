'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@hazel/shared';
import { useCart } from '../store/useCart';
import { ShoppingBag, ChevronRight, ShieldCheck, Truck, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const addItem = useCart((state) => state.addItem);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Default');
  const [activeImage, setActiveImage] = useState(product.images[0] || '/placeholder.jpg');
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [sizeGuideImageUrl, setSizeGuideImageUrl] = useState('');
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false);

  useEffect(() => {
    async function loadSizeGuide() {
      try {
        const { data } = await supabase
          .from('content')
          .select('data')
          .eq('section_key', 'size_guide')
          .single();
        if (data?.data?.images && product.category_id) {
          setSizeGuideImageUrl(data.data.images[product.category_id] || '');
        }
      } catch (err) {
        console.error('Error loading size guide:', err);
      }
    }
    loadSizeGuide();
  }, [product.category_id]);

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      qty: quantity,
      size: selectedSize,
      color: selectedColor,
      image_url: product.images[0] || '/placeholder.jpg',
    });

    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
    }, 3000);
  };

  const isLowStock = product.stock_qty > 0 && product.stock_qty <= 5;
  const isOutOfStock = product.stock_qty <= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
      {/* 1. Image Gallery Panel */}
      <div className="space-y-4">
        {/* Main Image View */}
        <div className="aspect-[3/4] w-full overflow-hidden bg-white border border-brand-primary-light/10 rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={activeImage} 
            alt={product.name} 
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* Thumbnails Grid (Cloudinary URLs) */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(imgUrl)}
                className={`aspect-[3/4] rounded overflow-hidden border bg-white ${
                  activeImage === imgUrl ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-brand-primary-light/25'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={`${product.name} thumbnail ${idx}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Product Information Panel */}
      <div className="flex flex-col justify-start space-y-6">
        <div>
          {product.material && (
            <span className="text-[10px] tracking-[0.25em] text-brand-primary uppercase font-bold">{product.material}</span>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-secondary mt-1">{product.name}</h1>
          <p className="text-2xl font-bold text-brand-secondary mt-3">LKR {Number(product.price).toFixed(2)}</p>
        </div>

        <hr className="border-brand-primary-light/15" />

        {/* Size Selector */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-bold text-brand-secondary">Select Size</span>
            {sizeGuideImageUrl && (
              <button
                onClick={() => setShowSizeGuideModal(true)}
                className="text-xs text-brand-primary font-semibold hover:underline"
              >
                Size Guide
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`flex h-12 min-w-12 items-center justify-center rounded border text-xs font-bold transition px-4 ${
                  selectedSize === size
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-brand-primary-light/30 bg-white text-brand-secondary hover:border-brand-primary'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Swatch */}
        <div className="space-y-3">
          <span className="text-sm font-bold text-brand-secondary block">Select Color</span>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => {
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`flex items-center gap-2 rounded-full border p-1 px-4 text-xs font-bold transition ${
                    active
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-primary-light/30 bg-white text-brand-secondary hover:border-brand-primary'
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-brand-primary-light/35" style={{ backgroundColor: color.toLowerCase().includes('wash') || color.toLowerCase().includes('denim') ? '#8da9c4' : color.replace(/\s+/g, '').toLowerCase() }} />
                  {color}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity and Availability Check */}
        <div className="space-y-3">
          <span className="text-sm font-bold text-brand-secondary block">Availability</span>
          <div className="flex items-center gap-4">
            {isOutOfStock ? (
              <span className="inline-flex items-center rounded bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Out of Stock</span>
            ) : isLowStock ? (
              <span className="inline-flex items-center rounded bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">Low Stock (Only {product.stock_qty} left)</span>
            ) : (
              <span className="inline-flex items-center rounded bg-green-100 px-3 py-1 text-xs font-bold text-green-800">In Stock</span>
            )}
          </div>
        </div>

        {/* Add to Cart Actions */}
        <div className="pt-4 space-y-4">
          <div className="flex gap-4">
            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="flex items-center border border-brand-primary-light/30 rounded bg-white h-14">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 px-4 text-brand-secondary/60 hover:text-brand-primary font-bold"
                >
                  -
                </button>
                <span className="px-3 font-semibold text-brand-secondary w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 px-4 text-brand-secondary/60 hover:text-brand-primary font-bold"
                >
                  +
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-3 rounded h-14 text-sm font-bold tracking-widest text-white transition ${
                isOutOfStock 
                  ? 'bg-brand-secondary/35 cursor-not-allowed' 
                  : 'bg-brand-secondary hover:bg-brand-primary'
              }`}
            >
              <ShoppingBag size={18} />
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
            </button>
          </div>

          {/* Success Toast */}
          {addedMessage && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-bold rounded flex items-center gap-2 animate-fade-in">
              ✓ Added to shopping bag successfully! Open your bag to complete checkout.
            </div>
          )}
        </div>

        <hr className="border-brand-primary-light/15" />

        {/* Description & Specs */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-brand-secondary">Description</h3>
          <p className="text-sm leading-6 text-brand-secondary/70">{product.description || 'No description available for this item.'}</p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-brand-primary-light/15 pt-6 text-center text-xs font-semibold text-brand-secondary/70">
          <div className="flex flex-col items-center gap-1.5">
            <Truck size={18} className="text-brand-primary" />
            <span>Island-wide Shipping</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ShieldCheck size={18} className="text-brand-primary" />
            <span>Secure Bank Pay</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RefreshCw size={18} className="text-brand-primary" />
            <span>Easy Swap Returns</span>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuideModal && sizeGuideImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSizeGuideModal(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setShowSizeGuideModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
            >
              <X size={20} className="text-brand-secondary" />
            </button>
            <div className="p-6">
              <h3 className="font-serif text-2xl font-bold text-brand-secondary mb-4">Size Guide</h3>
              <div className="overflow-auto max-h-[70vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sizeGuideImageUrl}
                  alt="Size Guide"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
