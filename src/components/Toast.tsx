import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const bgColor = toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  const Icon = toast.type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-medium
        transition-all duration-300 ease-out
        ${bgColor}
        ${isExiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm flex-1">{toast.message}</span>
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    addToast,
    dismissToast,
    showSuccess: (message: string) => addToast('success', message),
    showError: (message: string) => addToast('error', message),
  };
}
