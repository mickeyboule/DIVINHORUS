import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm transition-all duration-200 ${
            toast.type === 'success'
              ? 'bg-[#141413] text-white border-[#2A2A27]'
              : 'bg-red-950 text-red-50 border-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#E5B84B] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fermer la notification"
            className="text-white/70 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
