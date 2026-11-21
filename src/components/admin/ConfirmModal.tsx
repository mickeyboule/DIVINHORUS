import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-black/45" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-white border border-[#E3E3E6] rounded-xl shadow-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {danger && (
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-[#141413]">{title}</h3>
              <p className="mt-1.5 text-sm text-[#5C5A55] leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="text-[#8A877E] hover:text-[#141413]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-xs font-semibold text-[#3F3E3A] bg-white border border-[#D9D6CF] rounded-lg hover:bg-[#F7F7F8]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-50 ${
              danger ? 'bg-red-700 hover:bg-red-800' : 'bg-[#8F6B18] hover:bg-[#735613]'
            }`}
          >
            {busy ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
