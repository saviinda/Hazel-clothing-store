'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  title?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {children}
    </div>
  );
}

export function Toast({ message, title, type, onClose }: ToastProps) {
  const iconMap = {
    success: <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />,
    error: <XCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />,
    warning: <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />,
    info: <Info className="text-brand-primary flex-shrink-0 mt-0.5" size={18} />,
  };

  const styleMap = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-brand-primary-cream border-brand-primary-light/20 text-brand-secondary',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-lg animate-slide-in transition-all duration-300 ${styleMap[type]}`}
      role="alert"
    >
      <div className="flex gap-2.5 items-start min-w-0">
        {iconMap[type]}
        <div className="min-w-0">
          {title && (
            <p className="text-xs font-bold leading-tight tracking-wide mb-0.5">{title}</p>
          )}
          <p className={`text-xs leading-relaxed tracking-wide ${title ? 'font-normal opacity-80' : 'font-semibold'}`}>
            {message}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-brand-secondary/40 hover:text-brand-secondary transition shrink-0 p-0.5 rounded-full hover:bg-black/5 mt-0.5"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
