import { Check, CreditCard, Download, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import CategoryBadge from '../components/CategoryBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SelectField, TextArea, TextField, ToggleField } from '../components/FormField.jsx';
import MoneyInput from '../components/MoneyInput.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { createCardPurchase, deleteCard, deleteTransaction, markInvoicePaid, saveCard, saveSingleTransaction } from '../services/cardService.js';
import { getInvoiceMeta } from '../services/invoiceService.js';
import { getTransactionsByCardForInvoice } from '../services/financeSelectors.js';
import { todayISO } from '../utils/dateUtils.js';
import { formatMoney } from '../utils/moneyUtils.js';
import InvoiceImportPage from './InvoiceImportPage.jsx';

const CARD_COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#e11d48', '#111827', '#ca8a04'];

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

export default function CardsPage({ data, selectedMonth, onMonthChange, refresh, showToast }) {
  const [cardForm, setCardForm] = useState(null);
  const [transactionForm, setTransactionForm] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [activeCardId, setActiveCardId] = useState(data.cards[0]?.id || '');
  const [importCardId, setImportCardId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const activeCard = data.cards.find((card) => card.id === activeCardId) || data.cards[0];
  const invoice = activeCard ? getInvoiceMeta(activeCard, selectedMonth, data.card_invoices, data.card_transactions) : null;
  const invoiceTransactions = useMemo(
    () => (activeCard ? getTransactionsByCardForInvoice(data, activeCard.id, selectedMonth) : []),
    [activeCard, data, selectedMonth],
  );
  const defaultCategoryId = data.categories[0]?.id || '';

  if (importCardId) {
    return (
      <InvoiceImportPage
        data={data}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        initialCardId={importCardId}
        onBack={() => setImportCardId(null)}
        refresh={refresh}
        showToast={showToast}
      />
    );
  }

  function newCard() {
    setCardForm({
      name: '',
      issuer: '',
      closingDay: 20,
      dueDay: 10,
      limit: '',
      color: CARD_COLORS[0],
      active: true,
    });
  }

  function newTransaction(cardId = activeCard?.id) {
    setTransactionForm({
      description: '',
      amount: '',
      purchaseDate: todayISO(),
      categoryId: defaultCategoryId,
      cardId,
      invoiceMonth: selectedMonth,
      installments: 1,
      installmentNumber: 1,
      notes: '',
    });
  }

  async function submitCard(event) {
    event.preventDefault();
    const saved = await saveCard(cardForm);
    setActiveCardId(saved.id);
    setCardForm(null);
    await refresh();
    showToast('Cartão salvo.');
  }

  async function submitTransaction(event) {
    event.preventDefault();
    if (transactionForm.id) {
      await saveSingleTransaction(transactionForm);
      showToast('Lançamento atualizado.');
    } else {
      await createCardPurchase(transactionForm);
      showToast('Compra lançada.');
    }
    setTransactionForm(null);
    await refresh();
  }

  async function submitInvoicePayment(event) {
    event.preventDefault();
    await markInvoicePaid(payingInvoice.cardId, payingInvoice.month, payingInvoice.paidAmount, payingInvoice.paidAt);
    setPayingInvoice(null);
    await refresh();
    showToast('Fatura marcada como paga.');
  }

  async function confirmAction() {
    if (confirm.kind === 'card') {
      await deleteCard(confirm.id);
      setActiveCardId('');
      showToast('Cartão excluído.');
    }
    if (confirm.kind === 'transaction') {
      await deleteTransaction(confirm.id, confirm.scope);
      showToast(confirm.scope === 'all' ? 'Compra parcelada excluída.' : 'Lançamento excluído.');
    }
    setConfirm(null);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <MonthSelector month={selectedMonth} onChange={onMonthChange} />

      <button type="button" onClick={newCard} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 font-black text-white shadow-lift">
        <Plus size={20} /> Novo cartão
      </button>

      {data.cards.length ? (
        <section className="space-y-3">
          {data.cards.map((card) => {
            const itemInvoice = getInvoiceMeta(card, selectedMonth, data.card_invoices, data.card_transactions);
            return (
              <article key={card.id} className="overflow-hidden rounded-3xl bg-white shadow-soft">
                <div className="p-4 text-white" style={{ backgroundColor: card.color }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black">{card.name}</p>
                      <p className="text-sm opacity-80">{card.issuer || 'Sem emissor'} • Vence dia {card.dueDay}</p>
                    </div>
                    <CreditCard size={26} />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase opacity-75">Fatura atual</p>
                      <p className="text-2xl font-black">{formatMoney(itemInvoice.total)}</p>
                    </div>
                    <StatusBadge status={itemInvoice.status} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setActiveCardId(card.id)}
                    className="flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-slate-100 text-sm font-black text-slate-700"
                  >
                    <Eye size={16} /> Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => newTransaction(card.id)}
                    className="flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-emerald-100 text-sm font-black text-emerald-800"
                  >
                    <Plus size={16} /> Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportCardId(card.id)}
                    className="flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-sky-100 text-sm font-black text-sky-800"
                  >
                    <Download size={16} /> Fatura
                  </button>
                  <button type="button" onClick={() => setCardForm(card)} className="grid min-h-11 place-items-center rounded-2xl bg-slate-100 text-slate-700" aria-label="Editar cartão">
                    <Pencil size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState title="Nenhum cartão cadastrado" message="Cadastre seus cartões para controlar faturas, compras manuais e importações conferidas." />
      )}

      {activeCard && invoice ? (
        <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Fatura de {activeCard.name}</h2>
              <p className="text-sm text-slate-500">Fechamento {invoice.closingDate.split('-').reverse().join('/')} • Vencimento {invoice.dueDate.split('-').reverse().join('/')}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="rounded-3xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-bold uppercase text-slate-400">Total da fatura</p>
            <p className="mt-1 text-3xl font-black">{formatMoney(invoice.total)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => newTransaction(activeCard.id)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-100 font-black text-emerald-800"
            >
              <Plus size={18} /> Compra
            </button>
            <button
              type="button"
              onClick={() => setPayingInvoice({ ...invoice, paidAmount: String(invoice.total || ''), paidAt: todayISO() })}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 font-black text-slate-700"
            >
              <Check size={18} /> Pagar
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-950">Lançamentos</h3>
            {invoiceTransactions.length ? (
              invoiceTransactions.map((transaction) => (
                <article key={transaction.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{transaction.description}</p>
                      <p className="text-xs text-slate-500">
                        {transaction.purchaseDate?.split('-').reverse().join('/')} • Parcela {transaction.installmentNumber || 1}/{transaction.installments || 1}
                      </p>
                      <div className="mt-2">
                        <CategoryBadge categoryId={transaction.categoryId} categories={data.categories} />
                      </div>
                    </div>
                    <strong className="text-sm">{formatMoney(transaction.amount)}</strong>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionForm({ ...transaction, amount: String(transaction.amount || '') })}
                      className="min-h-10 rounded-2xl bg-white font-black text-slate-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: 'transaction', id: transaction.id, scope: 'single' })}
                      className="min-h-10 rounded-2xl bg-rose-50 font-black text-rose-700"
                    >
                      1 parcela
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: 'transaction', id: transaction.id, scope: 'all' })}
                      className="min-h-10 rounded-2xl bg-rose-100 font-black text-rose-800"
                    >
                      Todas
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Nenhum lançamento nesta fatura.</p>
            )}
          </div>
        </section>
      ) : null}

      {cardForm ? (
        <Sheet title={cardForm.id ? 'Editar cartão' : 'Novo cartão'} onClose={() => setCardForm(null)}>
          <form onSubmit={submitCard} className="space-y-3">
            <TextField label="Nome do cartão" value={cardForm.name} onChange={(name) => setCardForm({ ...cardForm, name })} required />
            <TextField label="Banco/emissor" value={cardForm.issuer || ''} onChange={(issuer) => setCardForm({ ...cardForm, issuer })} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Fechamento" type="number" min="1" max="31" value={cardForm.closingDay} onChange={(closingDay) => setCardForm({ ...cardForm, closingDay })} />
              <TextField label="Vencimento" type="number" min="1" max="31" value={cardForm.dueDay} onChange={(dueDay) => setCardForm({ ...cardForm, dueDay })} />
            </div>
            <MoneyInput label="Limite opcional" value={cardForm.limit || ''} onChange={(limit) => setCardForm({ ...cardForm, limit })} />
            <div>
              <p className="mb-2 text-sm font-bold text-slate-700">Cor do cartão</p>
              <div className="grid grid-cols-6 gap-2">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCardForm({ ...cardForm, color })}
                    className={`h-11 rounded-2xl border-4 ${cardForm.color === color ? 'border-slate-900' : 'border-white'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Escolher cor ${color}`}
                  />
                ))}
              </div>
            </div>
            <ToggleField label="Ativo" checked={cardForm.active} onChange={(active) => setCardForm({ ...cardForm, active })} />
            {cardForm.id ? (
              <button
                type="button"
                onClick={() => setConfirm({ kind: 'card', id: cardForm.id })}
                className="min-h-12 w-full rounded-2xl bg-rose-100 font-black text-rose-700"
              >
                Excluir cartão e lançamentos
              </button>
            ) : null}
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Salvar cartão
            </button>
          </form>
        </Sheet>
      ) : null}

      {transactionForm ? (
        <Sheet title={transactionForm.id ? 'Editar lançamento' : 'Lançar compra'} onClose={() => setTransactionForm(null)}>
          <form onSubmit={submitTransaction} className="space-y-3">
            <TextField label="Descrição" value={transactionForm.description} onChange={(description) => setTransactionForm({ ...transactionForm, description })} required />
            <MoneyInput label={transactionForm.id ? 'Valor da parcela' : 'Valor total da compra'} value={transactionForm.amount} onChange={(amount) => setTransactionForm({ ...transactionForm, amount })} required />
            <TextField label="Data da compra" type="date" value={transactionForm.purchaseDate} onChange={(purchaseDate) => setTransactionForm({ ...transactionForm, purchaseDate })} />
            <SelectField label="Categoria" value={transactionForm.categoryId} onChange={(categoryId) => setTransactionForm({ ...transactionForm, categoryId })}>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Cartão" value={transactionForm.cardId} onChange={(cardId) => setTransactionForm({ ...transactionForm, cardId })}>
              {data.cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Mês da fatura" type="month" value={transactionForm.invoiceMonth} onChange={(invoiceMonth) => setTransactionForm({ ...transactionForm, invoiceMonth })} />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Parcelas"
                type="number"
                min="1"
                value={transactionForm.installments}
                onChange={(installments) => setTransactionForm({ ...transactionForm, installments })}
              />
              <TextField
                label="Parcela atual"
                type="number"
                min="1"
                value={transactionForm.installmentNumber}
                onChange={(installmentNumber) => setTransactionForm({ ...transactionForm, installmentNumber })}
              />
            </div>
            <TextArea label="Observações" value={transactionForm.notes || ''} onChange={(notes) => setTransactionForm({ ...transactionForm, notes })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Salvar lançamento
            </button>
          </form>
        </Sheet>
      ) : null}

      {payingInvoice ? (
        <Sheet title="Pagar fatura" onClose={() => setPayingInvoice(null)}>
          <form onSubmit={submitInvoicePayment} className="space-y-3">
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Fatura total: {formatMoney(payingInvoice.total)}</p>
            <MoneyInput label="Valor pago" value={payingInvoice.paidAmount} onChange={(paidAmount) => setPayingInvoice({ ...payingInvoice, paidAmount })} required />
            <TextField label="Data de pagamento" type="date" value={payingInvoice.paidAt} onChange={(paidAt) => setPayingInvoice({ ...payingInvoice, paidAt })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Confirmar pagamento
            </button>
          </form>
        </Sheet>
      ) : null}

      <ConfirmModal
        open={Boolean(confirm)}
        danger
        title="Confirmar exclusão?"
        message={
          confirm?.kind === 'card'
            ? 'O cartão, suas faturas e lançamentos serão removidos.'
            : confirm?.scope === 'all'
              ? 'Todas as parcelas desta compra serão excluídas.'
              : 'Somente este lançamento será excluído.'
        }
        confirmLabel="Excluir"
        onCancel={() => setConfirm(null)}
        onConfirm={confirmAction}
      />
    </div>
  );
}
