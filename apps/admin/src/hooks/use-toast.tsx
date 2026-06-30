'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, Toast } from '../components/Toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastOptions {
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    (options: ToastOptions): void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  // Callable as toast({ type, title, message }) OR toast.success(message)
  const toastFn = useCallback((options: ToastOptions) => {
    addToast(options.message, options.type, options.title, options.duration);
  }, [addToast]) as ToastContextType['toast'];

  toastFn.success = useCallback((message: string, title?: string) => addToast(message, 'success', title), [addToast]);
  toastFn.error   = useCallback((message: string, title?: string) => addToast(message, 'error',   title), [addToast]);
  toastFn.warning = useCallback((message: string, title?: string) => addToast(message, 'warning', title), [addToast]);
  toastFn.info    = useCallback((message: string, title?: string) => addToast(message, 'info',    title), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: toastFn }}>
      {children}
      <ToastContainer>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            title={t.title}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
