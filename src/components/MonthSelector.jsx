import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { addMonths, currentMonthKey, formatMonth } from '../utils/dateUtils.js';

export default function MonthSelector({ month, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-3xl border border-emerald-100 bg-white p-2 shadow-soft">
      <button
        type="button"
        aria-label="Mês anterior"
        className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700"
        onClick={() => onChange(addMonths(month, -1))}
      >
        <ChevronLeft size={20} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Mês selecionado</p>
        <p className="truncate text-base font-black text-slate-950">{formatMonth(month)}</p>
      </div>
      <button
        type="button"
        aria-label="Mês atual"
        className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"
        onClick={() => onChange(currentMonthKey())}
      >
        <RotateCcw size={18} />
      </button>
      <button
        type="button"
        aria-label="Próximo mês"
        className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
