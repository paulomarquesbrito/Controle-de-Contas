import { BarChart3, CreditCard, PiggyBank, ReceiptText } from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { buildMonthlyReport, buildMonthSummary, summarizeMonthCategories } from '../services/financeSelectors.js';
import { formatMonth } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';

function BarRow({ label, value, max, color = 'bg-emerald-500' }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-bold text-slate-700">{label}</span>
        <strong>{formatMoney(value)}</strong>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function ReportsPage({ data, selectedMonth, onMonthChange }) {
  const summary = buildMonthSummary(data, selectedMonth);
  const monthly = buildMonthlyReport(data, 6);
  const maxTotal = Math.max(...monthly.map((item) => item.total), 1);
  const maxSavings = Math.max(...monthly.map((item) => Math.abs(item.accumulatedSavings)), 1);
  const categorySummary = summarizeMonthCategories(data, selectedMonth);

  return (
    <div className="space-y-4">
      <MonthSelector month={selectedMonth} onChange={onMonthChange} />

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard label="Total gasto" value={formatMoney(summary.monthTotal)} icon={BarChart3} tone="emerald" />
        <SummaryCard label="Contas pagas" value={formatMoney(summary.paidBillsTotal)} icon={ReceiptText} tone="white" />
        <SummaryCard label="Cartão" value={formatMoney(summary.cardsTotal)} icon={CreditCard} tone="blue" />
        <SummaryCard label="Saldo guardado" value={formatMoney(summary.savingsNet)} icon={PiggyBank} tone="slate" />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Gastos por mês</h2>
        {monthly.map((item) => (
          <BarRow key={item.month} label={formatMonth(item.month)} value={item.total} max={maxTotal} />
        ))}
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Comparativo mensal</h2>
        {monthly.map((item) => (
          <article key={item.month} className="rounded-2xl bg-slate-50 p-3">
            <strong className="text-sm text-slate-950">{formatMonth(item.month)}</strong>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <p>Contas: <b>{formatMoney(item.bills)}</b></p>
              <p>Cartão: <b>{formatMoney(item.cards)}</b></p>
              <p>Guardado: <b>{formatMoney(item.saved)}</b></p>
              <p>Retirado: <b>{formatMoney(item.withdrawn)}</b></p>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Gastos por categoria</h2>
        {categorySummary.length ? (
          categorySummary.map((item) => (
            <div key={item.category.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
              <CategoryBadge categoryId={item.category.id} categories={data.categories} />
              <strong>{formatMoney(item.total)}</strong>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Sem gastos categorizados neste mês.</p>
        )}
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Gastos por cartão</h2>
        {summary.cards.length ? (
          summary.cards.map((invoice) => {
            const card = data.cards.find((item) => item.id === invoice.cardId);
            return (
              <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="truncate text-sm font-black text-slate-900">{card?.name || 'Cartão'}</span>
                <strong>{formatMoney(invoice.total)}</strong>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">Nenhum cartão com gasto neste mês.</p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Evolução do dinheiro guardado</h2>
        {monthly.map((item) => (
          <BarRow key={item.month} label={formatMonth(item.month)} value={Math.abs(item.accumulatedSavings)} max={maxSavings} color={item.accumulatedSavings >= 0 ? 'bg-sky-500' : 'bg-rose-500'} />
        ))}
      </section>
    </div>
  );
}
