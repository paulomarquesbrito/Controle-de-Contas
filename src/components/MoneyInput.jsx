export default function MoneyInput({ label, value, onChange, placeholder = '0,00', required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <div className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
        <span className="mr-2 font-black text-emerald-700">R$</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          inputMode="decimal"
          className="w-full bg-transparent text-base font-bold outline-none placeholder:text-slate-300"
        />
      </div>
    </label>
  );
}
