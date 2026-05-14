import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-4 backdrop-blur-sm sm:place-items-center">
      <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-lift">
        <div className="flex items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${danger ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <AlertTriangle size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{message}</p>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl bg-slate-100 px-4 font-black text-slate-700">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-12 rounded-2xl px-4 font-black text-white ${danger ? 'bg-rose-600' : 'bg-emerald-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
