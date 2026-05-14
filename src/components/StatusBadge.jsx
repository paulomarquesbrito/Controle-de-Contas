export default function StatusBadge({ status }) {
  const styles = {
    Paga: 'bg-emerald-100 text-emerald-800',
    'Em aberto': 'bg-sky-100 text-sky-800',
    Atrasada: 'bg-rose-100 text-rose-800',
    Aberta: 'bg-sky-100 text-sky-800',
    Fechada: 'bg-amber-100 text-amber-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
