import { BarChart3, CreditCard, PiggyBank, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import CategoryBadge from '../components/CategoryBadge.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { buildMonthlyReport, buildMonthSummary, summarizeMonthCategories } from '../services/financeSelectors.js';
import { addMonths, formatMonth } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';

function BarRow({ label, value, max, color = 'bg-emerald-500', signed = false }) {
  const numericValue = Number(value || 0);
  const absValue = Math.abs(numericValue);
  const width = max > 0 ? Math.max(4, Math.round((absValue / max) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-bold text-slate-700">{label}</span>
        <strong className={`shrink-0 whitespace-nowrap ${signed && numericValue < 0 ? 'text-rose-700' : ''}`}>
          {formatMoney(numericValue)}
        </strong>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function ReportsPage({ data, selectedMonth, onMonthChange }) {
  const [reportAnchorMonth, setReportAnchorMonth] = useState(selectedMonth);
  const summary = buildMonthSummary(data, selectedMonth);
  const monthly = buildMonthlyReport(data, 6, reportAnchorMonth);
  const maxTotal = Math.max(...monthly.map((item) => item.total), 1);
  const maxSavings = Math.max(...monthly.map((item) => Math.abs(item.savingsNet)), 1);
  const categorySummary = summarizeMonthCategories(data, selectedMonth);
  const periodLabel = `${formatMonth(monthly[0].month)} até ${formatMonth(monthly[monthly.length - 1].month)}`;

  function PeriodControls({ title }) {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500">{periodLabel}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setReportAnchorMonth(addMonths(reportAnchorMonth, -6))} className="min-h-11 rounded-2xl bg-slate-100 font-black text-slate-700">
            -6 meses
          </button>
          <button type="button" onClick={() => setReportAnchorMonth(selectedMonth)} className="min-h-11 rounded-2xl bg-emerald-100 font-black text-emerald-800">
            Atual
          </button>
          <button type="button" onClick={() => setReportAnchorMonth(addMonths(reportAnchorMonth, 6))} className="min-h-11 rounded-2xl bg-slate-100 font-black text-slate-700">
            +6 meses
          </button>
        </div>
      </div>
    );
  }

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
        <PeriodControls title="Gastos por mês" />
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
              <strong className="shrink-0 whitespace-nowrap">{formatMoney(item.total)}</strong>
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
                <strong className="shrink-0 whitespace-nowrap">{formatMoney(invoice.total)}</strong>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">Nenhum cartão com gasto neste mês.</p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-4 shadow-soft">
        <PeriodControls title="Evolução do dinheiro guardado" />
        {monthly.map((item) => (
          <BarRow
            key={item.month}
            label={formatMonth(item.month)}
            value={item.savingsNet}
            max={maxSavings}
            color={item.savingsNet >= 0 ? 'bg-sky-500' : 'bg-rose-500'}
            signed
          />
        ))}
        <p className="text-xs leading-relaxed text-slate-500">
          Valor negativo significa que no mês você retirou mais do que guardou.
        </p>
      </section>
    </div>
  );
}
