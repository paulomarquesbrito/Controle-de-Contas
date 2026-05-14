import { BarChart3, CreditCard, Home, PiggyBank, ReceiptText, Settings } from 'lucide-react';

const ITEMS = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'bills', label: 'Contas', icon: ReceiptText },
  { id: 'cards', label: 'Cartões', icon: CreditCard },
  { id: 'savings', label: 'Guardado', icon: PiggyBank },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

export default function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-10px_28px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`tap-highlight flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-[0.68rem] font-semibold transition ${
                active ? 'bg-emerald-600 text-white shadow-lift' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={2.4} />
              <span className="mt-1 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
