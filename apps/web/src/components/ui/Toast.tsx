'use client';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-sage text-white',
  error:   'bg-red-500 text-white',
  info:    'bg-regency text-white',
};

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg
                  font-medium text-sm animate-in slide-in-from-bottom-4 ${typeStyles[type]}`}
    >
      {message}
    </div>
  );
}

// Simple hook
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const show = (message: string, type: ToastType = 'success') => setToast({ message, type });
  const hide = () => setToast(null);
  return { toast, show, hide };
}
