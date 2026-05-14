import { PiggyBank, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import MoneyInput from '../components/MoneyInput.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import { TextArea } from '../components/FormField.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { getAccumulatedSavings, getSavingsForMonth, saveSavingsMonth } from '../services/savingsService.js';
import { formatMonth } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';

export default function SavingsPage({ data, selectedMonth, onMonthChange, refresh, showToast }) {
  const current = getSavingsForMonth(data.savings || [], selectedMonth);
  const [form, setForm] = useState(current);
  const accumulated = getAccumulatedSavings(data.savings || [], selectedMonth);
  const net = Number(current.savedAmount || 0) - Number(current.withdrawnAmount || 0);

  useEffect(() => {
    setForm({
      ...current,
      savedAmount: String(current.savedAmount || ''),
      withdrawnAmount: String(current.withdrawnAmount || ''),
    });
  }, [current.id, current.savedAmount, current.withdrawnAmount, current.notes]);

  async function submit(event) {
    event.preventDefault();
    await saveSavingsMonth(form);
    await refresh();
    showToast('Dinheiro guardado salvo.');
  }

  const history = [...(data.savings || [])].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="space-y-4">
      <MonthSelector month={selectedMonth} onChange={onMonthChange} />

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard label="Guardei no mês" value={formatMoney(current.savedAmount)} icon={PiggyBank} tone="emerald" />
        <SummaryCard label="Retirei no mês" value={formatMoney(current.withdrawnAmount)} tone="white" />
        <SummaryCard label="Saldo líquido" value={formatMoney(net)} tone={net >= 0 ? 'blue' : 'rose'} />
        <SummaryCard label="Acumulado estimado" value={formatMoney(accumulated)} tone="slate" />
      </section>

      <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Atualizar {formatMonth(selectedMonth)}</h2>
        <MoneyInput label="Quanto guardei" value={form.savedAmount} onChange={(savedAmount) => setForm({ ...form, savedAmount })} />
        <MoneyInput label="Quanto tirei" value={form.withdrawnAmount} onChange={(withdrawnAmount) => setForm({ ...form, withdrawnAmount })} />
        <TextArea label="Observação" value={form.notes || ''} onChange={(notes) => setForm({ ...form, notes })} />
        <button type="submit" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
          <Save size={20} /> Salvar mês
        </button>
      </form>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Histórico</h2>
        {history.length ? (
          history.map((item) => {
            const itemNet = Number(item.savedAmount || 0) - Number(item.withdrawnAmount || 0);
            return (
              <article key={item.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong>{formatMonth(item.month)}</strong>
                  <span className={`font-black ${itemNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(itemNet)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Guardou {formatMoney(item.savedAmount)} • Retirou {formatMoney(item.withdrawnAmount)}
                </p>
                {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
              </article>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">Nenhum mês preenchido ainda.</p>
        )}
      </section>
    </div>
  );
}
