export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/75 p-6 text-center shadow-soft">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-2xl">+</div>
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-500">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
