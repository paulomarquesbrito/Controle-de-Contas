import { Bell, CalendarClock, CreditCard, PiggyBank, ReceiptText, ShieldCheck, TrendingDown, Wallet } from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { buildMonthSummary } from '../services/financeSelectors.js';
import { notifyImportantAlerts } from '../services/notificationService.js';
import { formatDate, formatMonth } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';

function AlertCard({ alert }) {
  const styles = {
    danger: 'border-rose-100 bg-rose-50 text-rose-900',
    warning: 'border-amber-100 bg-amber-50 text-amber-900',
    info: 'border-sky-100 bg-sky-50 text-sky-900',
  };

  return (
    <div className={`rounded-2xl border p-3 ${styles[alert.type] || styles.info}`}>
      <p className="text-sm font-black">{alert.title}</p>
      <p className="mt-1 text-sm leading-relaxed opacity-80">{alert.message}</p>
    </div>
  );
}

export default function DashboardPage({ data, selectedMonth, onMonthChange, showToast }) {
  const summary = buildMonthSummary(data, selectedMonth);

  async function handleNotify() {
    const result = await notifyImportantAlerts(summary.alerts);
    showToast(result.message);
  }

  return (
    <div className="space-y-4">
      <MonthSelector month={selectedMonth} onChange={onMonthChange} />

      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-lift">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/20 text-emerald-200">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-lg font-black">Dados só neste dispositivo</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Exporte backups regularmente. Se os dados do navegador forem apagados sem backup, suas informações podem ser perdidas.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SummaryCard label="Total geral do mês" value={formatMoney(summary.monthTotal)} helper={formatMonth(selectedMonth)} icon={Wallet} tone="emerald" />
        </div>
        <SummaryCard label="Contas" value={formatMoney(summary.billsTotal)} icon={ReceiptText} tone="white" />
        <SummaryCard label="Cartão" value={formatMoney(summary.cardsTotal)} icon={CreditCard} tone="blue" />
        <SummaryCard label="Já pago" value={formatMoney(summary.paidBillsTotal)} icon={ShieldCheck} tone="white" />
        <SummaryCard label="Em aberto" value={formatMoney(summary.openBillsTotal)} icon={CalendarClock} tone="amber" />
        <SummaryCard label="Atrasado" value={formatMoney(summary.overdueBillsTotal)} icon={TrendingDown} tone="rose" />
        <SummaryCard label="Guardei" value={formatMoney(summary.savedAmount)} icon={PiggyBank} tone="white" />
        <SummaryCard label="Retirei" value={formatMoney(summary.withdrawnAmount)} tone="white" />
        <SummaryCard label="Saldo guardado" value={formatMoney(summary.savingsNet)} helper={`Acumulado: ${formatMoney(summary.accumulatedSavings)}`} tone="slate" />
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Avisos importantes</h2>
            <p className="text-sm text-slate-500">A central interna funciona mesmo sem notificação do celular.</p>
          </div>
          <button
            type="button"
            onClick={handleNotify}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"
            aria-label="Enviar notificações locais"
          >
            <Bell size={20} />
          </button>
        </div>
        {summary.alerts.length ? (
          summary.alerts.slice(0, 5).map((alert, index) => <AlertCard key={`${alert.title}-${index}`} alert={alert} />)
        ) : (
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Nenhum aviso crítico para este mês.</p>
        )}
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Categorias com maior gasto</h2>
        {summary.topCategories.length ? (
          summary.topCategories.slice(0, 6).map((item) => (
            <div key={item.category.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
              <CategoryBadge categoryId={item.category.id} categories={data.categories} />
              <strong className="text-sm text-slate-950">{formatMoney(item.total)}</strong>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Sem gastos lançados neste mês.</p>
        )}
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Resumo por cartão</h2>
        {summary.cards.length ? (
          summary.cards.map((invoice) => {
            const card = data.cards.find((item) => item.id === invoice.cardId);
            return (
              <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{card?.name || 'Cartão'}</p>
                  <p className="text-xs text-slate-500">Vence em {formatDate(invoice.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatMoney(invoice.total)}</p>
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">Cadastre cartões para ver faturas aqui.</p>
        )}
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-slate-950">Próximas contas</h2>
        {summary.upcomingBills.length ? (
          summary.upcomingBills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{bill.name}</p>
                <p className="text-xs text-slate-500">Vence em {formatDate(bill.dueDate)}</p>
              </div>
              <StatusBadge status={bill.effectiveStatus} />
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nenhuma conta vencendo nos próximos dias.</p>
        )}
      </section>
    </div>
  );
}
