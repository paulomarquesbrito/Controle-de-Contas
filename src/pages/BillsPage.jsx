import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import CategoryBadge from '../components/CategoryBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SelectField, TextArea, TextField, ToggleField } from '../components/FormField.jsx';
import MoneyInput from '../components/MoneyInput.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  BILL_STATUS,
  deleteMonthlyBill,
  deleteRecurringBill,
  ensureBillsForMonth,
  markBillPaid,
  saveMonthlyBill,
  saveRecurringBill,
} from '../services/billService.js';
import { billsForMonth } from '../services/financeSelectors.js';
import { dateFromMonthDay, todayISO } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';

function Sheet({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-lift">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function categoryOptions(categories) {
  return categories.map((category) => (
    <option key={category.id} value={category.id}>
      {category.icon} {category.name}
    </option>
  ));
}

export default function BillsPage({ data, selectedMonth, onMonthChange, refresh, showToast }) {
  const [tab, setTab] = useState('month');
  const [billForm, setBillForm] = useState(null);
  const [recurringForm, setRecurringForm] = useState(null);
  const [payingBill, setPayingBill] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const monthBills = useMemo(() => billsForMonth(data.monthly_bills || [], selectedMonth), [data.monthly_bills, selectedMonth]);
  const defaultCategoryId = data.categories[0]?.id || '';

  function newBillForm() {
    setBillForm({
      name: '',
      categoryId: defaultCategoryId,
      month: selectedMonth,
      dueDate: dateFromMonthDay(selectedMonth, 10),
      expectedAmount: '',
      paidAmount: '',
      status: BILL_STATUS.OPEN,
      paidAt: todayISO(),
      notes: '',
      source: 'manual',
    });
  }

  function editBillForm(bill) {
    setBillForm({
      ...bill,
      expectedAmount: String(bill.expectedAmount || ''),
      paidAmount: String(bill.paidAmount || ''),
    });
  }

  function newRecurringForm() {
    setRecurringForm({
      name: '',
      categoryId: defaultCategoryId,
      dueDay: 10,
      expectedAmount: '',
      type: 'fixa',
      notes: '',
      active: true,
      notifyBefore: true,
      notifyDaysBefore: 3,
    });
  }

  function editRecurringForm(bill) {
    setRecurringForm({
      ...bill,
      expectedAmount: String(bill.expectedAmount || ''),
    });
  }

  async function submitBill(event) {
    event.preventDefault();
    await saveMonthlyBill(billForm);
    setBillForm(null);
    await refresh();
    showToast('Conta salva.');
  }

  async function submitRecurring(event) {
    event.preventDefault();
    await saveRecurringBill(recurringForm);
    await ensureBillsForMonth(selectedMonth);
    setRecurringForm(null);
    await refresh();
    showToast('Conta recorrente salva.');
  }

  async function submitPayment(event) {
    event.preventDefault();
    await markBillPaid(payingBill.id, payingBill.paidAmount, payingBill.paidAt);
    setPayingBill(null);
    await refresh();
    showToast('Conta marcada como paga.');
  }

  async function confirmDeleteItem() {
    if (confirmDelete.type === 'monthly') {
      await deleteMonthlyBill(confirmDelete.id);
      showToast('Conta removida.');
    } else {
      await deleteRecurringBill(confirmDelete.id);
      showToast('Recorrência removida.');
    }
    setConfirmDelete(null);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <MonthSelector month={selectedMonth} onChange={onMonthChange} />

      <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white p-2 shadow-soft">
        <button
          type="button"
          onClick={() => setTab('month')}
          className={`min-h-12 rounded-2xl font-black ${tab === 'month' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Contas do mês
        </button>
        <button
          type="button"
          onClick={() => setTab('recurring')}
          className={`min-h-12 rounded-2xl font-black ${tab === 'recurring' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Recorrentes
        </button>
      </div>

      {tab === 'month' ? (
        <section className="space-y-3">
          <button type="button" onClick={newBillForm} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 font-black text-white shadow-lift">
            <Plus size={20} /> Nova conta manual
          </button>

          {monthBills.length ? (
            monthBills.map((bill) => (
              <article key={bill.id} className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950">{bill.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Vence em {bill.dueDate.split('-').reverse().join('/')}</p>
                    <div className="mt-2">
                      <CategoryBadge categoryId={bill.categoryId} categories={data.categories} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950">{formatMoney(bill.effectiveStatus === BILL_STATUS.PAID ? bill.paidAmount : bill.expectedAmount)}</p>
                    <StatusBadge status={bill.effectiveStatus} />
                  </div>
                </div>
                {bill.notes ? <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{bill.notes}</p> : null}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayingBill({ ...bill, paidAmount: String(bill.paidAmount || bill.expectedAmount || ''), paidAt: todayISO() })}
                    className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-100 font-black text-emerald-800"
                  >
                    <Check size={18} /> Pagar
                  </button>
                  <button type="button" onClick={() => editBillForm(bill)} className="grid min-h-11 place-items-center rounded-2xl bg-slate-100 text-slate-700" aria-label="Editar">
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ type: 'monthly', id: bill.id })}
                    className="grid min-h-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"
                    aria-label="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="Nenhuma conta neste mês" message="Cadastre uma conta manual ou crie contas recorrentes para o app gerar automaticamente." />
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <button type="button" onClick={newRecurringForm} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 font-black text-white shadow-lift">
            <Plus size={20} /> Nova recorrente
          </button>

          {(data.recurring_bills || []).length ? (
            data.recurring_bills.map((bill) => (
              <article key={bill.id} className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950">{bill.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Todo dia {bill.dueDay} • {bill.type === 'variavel' ? 'Variável' : 'Fixa'}
                    </p>
                    <div className="mt-2">
                      <CategoryBadge categoryId={bill.categoryId} categories={data.categories} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950">{formatMoney(bill.expectedAmount)}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${bill.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {bill.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => editRecurringForm(bill)} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 font-black text-slate-700">
                    <Pencil size={18} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ type: 'recurring', id: bill.id })}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-100 font-black text-rose-700"
                  >
                    <Trash2 size={18} /> Excluir
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="Sem contas recorrentes" message="Cadastre aluguel, água, internet, energia e outras despesas que se repetem todo mês." />
          )}
        </section>
      )}

      {billForm ? (
        <Sheet title={billForm.id ? 'Editar conta' : 'Nova conta manual'} onClose={() => setBillForm(null)}>
          <form onSubmit={submitBill} className="space-y-3">
            <TextField label="Nome da conta" value={billForm.name} onChange={(name) => setBillForm({ ...billForm, name })} required />
            <SelectField label="Categoria" value={billForm.categoryId} onChange={(categoryId) => setBillForm({ ...billForm, categoryId })}>
              {categoryOptions(data.categories)}
            </SelectField>
            <TextField label="Data de vencimento" type="date" value={billForm.dueDate} onChange={(dueDate) => setBillForm({ ...billForm, dueDate })} required />
            <MoneyInput label="Valor previsto" value={billForm.expectedAmount} onChange={(expectedAmount) => setBillForm({ ...billForm, expectedAmount })} required />
            <SelectField label="Status" value={billForm.status} onChange={(status) => setBillForm({ ...billForm, status })}>
              <option>{BILL_STATUS.OPEN}</option>
              <option>{BILL_STATUS.PAID}</option>
            </SelectField>
            {billForm.status === BILL_STATUS.PAID ? (
              <>
                <MoneyInput label="Valor real pago" value={billForm.paidAmount} onChange={(paidAmount) => setBillForm({ ...billForm, paidAmount })} required />
                <TextField label="Data de pagamento" type="date" value={billForm.paidAt || todayISO()} onChange={(paidAt) => setBillForm({ ...billForm, paidAt })} />
              </>
            ) : null}
            <TextArea label="Observações" value={billForm.notes || ''} onChange={(notes) => setBillForm({ ...billForm, notes })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Salvar conta
            </button>
          </form>
        </Sheet>
      ) : null}

      {recurringForm ? (
        <Sheet title={recurringForm.id ? 'Editar recorrente' : 'Nova recorrente'} onClose={() => setRecurringForm(null)}>
          <form onSubmit={submitRecurring} className="space-y-3">
            <TextField label="Nome da conta" value={recurringForm.name} onChange={(name) => setRecurringForm({ ...recurringForm, name })} required />
            <SelectField label="Categoria" value={recurringForm.categoryId} onChange={(categoryId) => setRecurringForm({ ...recurringForm, categoryId })}>
              {categoryOptions(data.categories)}
            </SelectField>
            <TextField label="Dia de vencimento" type="number" min="1" max="31" value={recurringForm.dueDay} onChange={(dueDay) => setRecurringForm({ ...recurringForm, dueDay })} required />
            <MoneyInput label="Valor padrão ou estimado" value={recurringForm.expectedAmount} onChange={(expectedAmount) => setRecurringForm({ ...recurringForm, expectedAmount })} required />
            <SelectField label="Tipo" value={recurringForm.type} onChange={(type) => setRecurringForm({ ...recurringForm, type })}>
              <option value="fixa">Fixa</option>
              <option value="variavel">Variável</option>
            </SelectField>
            <ToggleField label="Ativa" checked={recurringForm.active} onChange={(active) => setRecurringForm({ ...recurringForm, active })} />
            <ToggleField label="Notificar antes" checked={recurringForm.notifyBefore} onChange={(notifyBefore) => setRecurringForm({ ...recurringForm, notifyBefore })} />
            <TextField
              label="Quantos dias antes avisar"
              type="number"
              min="1"
              max="30"
              value={recurringForm.notifyDaysBefore}
              onChange={(notifyDaysBefore) => setRecurringForm({ ...recurringForm, notifyDaysBefore })}
            />
            <TextArea label="Observações" value={recurringForm.notes || ''} onChange={(notes) => setRecurringForm({ ...recurringForm, notes })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Salvar recorrente
            </button>
          </form>
        </Sheet>
      ) : null}

      {payingBill ? (
        <Sheet title="Pagar conta" onClose={() => setPayingBill(null)}>
          <form onSubmit={submitPayment} className="space-y-3">
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{payingBill.name}</p>
            <MoneyInput label="Valor real pago" value={payingBill.paidAmount} onChange={(paidAmount) => setPayingBill({ ...payingBill, paidAmount })} required />
            <TextField label="Data de pagamento" type="date" value={payingBill.paidAt} onChange={(paidAt) => setPayingBill({ ...payingBill, paidAt })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Confirmar pagamento
            </button>
          </form>
        </Sheet>
      ) : null}

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Excluir registro?"
        message="Esta ação remove o item escolhido. Se for uma recorrência, as contas mensais já geradas continuam no histórico."
        danger
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
