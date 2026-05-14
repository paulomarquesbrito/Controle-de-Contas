import { dateFromMonthDay, todayISO } from '../utils/dateUtils.js';
import { INVOICE_STATUS, invoiceId } from './cardService.js';

export function getInvoiceTransactions(transactions, cardId, month) {
  return transactions.filter((transaction) => transaction.cardId === cardId && transaction.invoiceMonth === month);
}

export function getInvoiceTotal(transactions, cardId, month) {
  return getInvoiceTransactions(transactions, cardId, month).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

export function getInvoiceMeta(card, month, invoices = [], transactions = [], today = todayISO()) {
  const stored = invoices.find((invoice) => invoice.id === invoiceId(card.id, month));
  const closingDate = dateFromMonthDay(month, card.closingDay);
  const dueDate = dateFromMonthDay(month, card.dueDay);
  const total = getInvoiceTotal(transactions, card.id, month);

  let status = stored?.status || INVOICE_STATUS.OPEN;
  if (status !== INVOICE_STATUS.PAID) {
    if (dueDate < today) status = INVOICE_STATUS.OVERDUE;
    else if (closingDate < today) status = INVOICE_STATUS.CLOSED;
    else status = INVOICE_STATUS.OPEN;
  }

  return {
    id: invoiceId(card.id, month),
    cardId: card.id,
    month,
    closingDate,
    dueDate,
    total,
    status,
    paidAmount: stored?.paidAmount || 0,
    paidAt: stored?.paidAt || null,
  };
}

export function summarizeTransactionsByCategory(transactions, categories) {
  return categories
    .map((category) => ({
      category,
      total: transactions
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}
