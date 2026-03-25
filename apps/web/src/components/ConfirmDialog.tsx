'use client';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'friendly';
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Ja, löschen',
  cancelLabel = 'Abbrechen',
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmClass = variant === 'danger'
    ? 'bg-red-400 hover:bg-red-500 text-white'
    : 'bg-regency hover:bg-regency-dark text-white';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-charcoal leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 text-sm">{cancelLabel}</button>
          <button onClick={onConfirm} className={`${confirmClass} font-semibold px-5 py-2.5 rounded-2xl transition-all flex-1 text-sm`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
