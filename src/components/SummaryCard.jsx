export default function SummaryCard({ label, value, helper, icon: Icon, tone = 'emerald' }) {
  const tones = {
    emerald: 'from-emerald-600 to-teal-700 text-white',
    slate: 'from-slate-900 to-slate-700 text-white',
    amber: 'from-amber-400 to-orange-500 text-slate-950',
    rose: 'from-rose-500 to-red-600 text-white',
    blue: 'from-sky-500 to-blue-700 text-white',
    white: 'from-white to-white text-slate-950 border border-slate-100',
  };

  return (
    <article className={`min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br p-4 shadow-soft ${tones[tone] || tones.emerald}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 truncate whitespace-nowrap text-[clamp(1.35rem,7vw,2rem)] font-black leading-tight" title={String(value)}>
            {value}
          </p>
        </div>
        {Icon ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {helper ? (
        <p className="mt-3 truncate whitespace-nowrap text-sm font-medium opacity-80" title={String(helper)}>
          {helper}
        </p>
      ) : null}
    </article>
  );
}
