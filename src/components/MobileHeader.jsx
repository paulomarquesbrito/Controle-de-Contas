export default function MobileHeader({ title, subtitle, action }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-emerald-50/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Meu Controle Financeiro</p>
          <h1 className="truncate text-xl font-black text-slate-950">{title}</h1>
          {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
