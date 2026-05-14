export function TextField({ label, value, onChange, placeholder, type = 'text', required = false, min, max }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, children, required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {children}
      </select>
    </label>
  );
}

export function ToggleField({ label, checked, onChange, description }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-3">
      <span>
        <span className="block text-sm font-black text-slate-800">{label}</span>
        {description ? <span className="block text-xs leading-relaxed text-slate-500">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-6 w-6 rounded-lg accent-emerald-600"
      />
    </label>
  );
}
