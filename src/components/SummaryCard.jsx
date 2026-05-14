function splitMoney(value) {
  const text = String(value);
  const match = text.match(/^(R\$\s?)(.+)$/);
  if (!match) return { prefix: '', amount: text };
  return { prefix: match[1].trim(), amount: match[2] };
}

export default function SummaryCard({ label, value, helper, icon: Icon, tone = 'emerald', size = 'compact' }) {
  const tones = {
    emerald: 'from-emerald-600 to-teal-700 text-white',
    slate: 'from-slate-900 to-slate-700 text-white',
    amber: 'from-amber-400 to-orange-500 text-slate-950',
    rose: 'from-rose-500 to-red-600 text-white',
    blue: 'from-sky-500 to-blue-700 text-white',
    white: 'from-white to-white text-slate-950 border border-slate-100',
  };

  const money = splitMoney(value);
  const isLarge = size === 'large';

  return (
    <article className={`min-w-0 rounded-3xl bg-gradient-to-br p-4 shadow-soft ${tones[tone] || tones.emerald}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-xs font-bold uppercase tracking-wide opacity-75">{label}</p>
        {Icon ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {isLarge ? (
        <p className="mt-3 whitespace-nowrap text-[clamp(1.8rem,8vw,2.55rem)] font-black leading-tight tabular-nums" title={String(value)}>
          {value}
        </p>
      ) : (
        <div className="mt-3 font-black leading-none tabular-nums" title={String(value)}>
          {money.prefix ? <span className="block text-[clamp(1.25rem,5.5vw,1.65rem)]">{money.prefix}</span> : null}
          <span className="block whitespace-nowrap text-[clamp(1.45rem,6vw,1.9rem)]">{money.amount}</span>
        </div>
      )}
      {helper ? (
        <p className="mt-3 truncate whitespace-nowrap text-sm font-medium opacity-80" title={String(helper)}>
          {helper}
        </p>
      ) : null}
    </article>
  );
}
