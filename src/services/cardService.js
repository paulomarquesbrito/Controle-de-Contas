import { getAll, getById, remove, upsert } from '../db/indexedDb.js';
import { addMonths, toMonthKey, todayISO } from '../utils/dateUtils.js';
import { createId } from '../utils/idUtils.js';
import { parseMoney, splitInstallments } from '../utils/moneyUtils.js';

export const INVOICE_STATUS = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  PAID: 'Paga',
  OVERDUE: 'Atrasada',
};

export async function saveCard(card) {
  return upsert('cards', {
    ...card,
    name: card.name?.trim(),
    issuer: card.issuer?.trim(),
    closingDay: Number(card.closingDay || 1),
    dueDay: Number(card.dueDay || 1),
    limit: parseMoney(card.limit),
    color: card.color || '#0f766e',
    active: Boolean(card.active),
  });
}

export async function deleteCard(id) {
  const transactions = await getAll('card_transactions');
  const invoices = await getAll('card_invoices');
  await Promise.all([
    ...transactions.filter((item) => item.cardId === id).map((item) => remove('card_transactions', item.id)),
    ...invoices.filter((item) => item.cardId === id).map((item) => remove('card_invoices', item.id)),
    remove('cards', id),
  ]);
}

export async function createCardPurchase(input) {
  const installments = Math.max(1, Number(input.installments || 1));
  const total = parseMoney(input.amount);
  const amounts = splitInstallments(total, installments);
  const groupId = createId('purchase');
  const baseMonth = input.invoiceMonth || toMonthKey(input.purchaseDate || todayISO());
  const saved = [];

  for (let index = 0; index < installments; index += 1) {
    const transaction = await upsert('card_transactions', {
      description: input.description?.trim(),
      amount: amounts[index],
      originalAmount: total,
      purchaseDate: input.purchaseDate || todayISO(),
      categoryId: input.categoryId,
      cardId: input.cardId,
      invoiceMonth: addMonths(baseMonth, index),
      installments,
      installmentNumber: index + 1,
      notes: input.notes || '',
      source: input.source || 'manual',
      installmentGroupId: groupId,
      importedFromLogId: input.importedFromLogId || null,
    });
    saved.push(transaction);
  }

  return saved;
}

export async function saveSingleTransaction(input) {
  return upsert('card_transactions', {
    ...input,
    description: input.description?.trim(),
    amount: parseMoney(input.amount),
    purchaseDate: input.purchaseDate || todayISO(),
    invoiceMonth: input.invoiceMonth || toMonthKey(input.purchaseDate || todayISO()),
    installments: Number(input.installments || 1),
    installmentNumber: Number(input.installmentNumber || 1),
  });
}

export async function deleteTransaction(id, scope = 'single') {
  const transaction = await getById('card_transactions', id);
  if (!transaction) return;

  if (scope === 'all' && transaction.installmentGroupId) {
    const all = await getAll('card_transactions');
    await Promise.all(
      all
        .filter((item) => item.installmentGroupId === transaction.installmentGroupId)
        .map((item) => remove('card_transactions', item.id)),
    );
    return;
  }

  await remove('card_transactions', id);
}

export function invoiceId(cardId, month) {
  return `${cardId}_${month}`;
}

export async function markInvoicePaid(cardId, month, paidAmount, paidAt = todayISO()) {
  const existing = await getById('card_invoices', invoiceId(cardId, month));
  return upsert('card_invoices', {
    ...(existing || {}),
    id: invoiceId(cardId, month),
    cardId,
    month,
    status: INVOICE_STATUS.PAID,
    paidAmount: parseMoney(paidAmount),
    paidAt,
  });
}
