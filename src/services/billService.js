import { getAll, getById, remove, upsert } from '../db/indexedDb.js';
import { dateFromMonthDay, todayISO } from '../utils/dateUtils.js';
import { parseMoney } from '../utils/moneyUtils.js';

export const BILL_STATUS = {
  OPEN: 'Em aberto',
  PAID: 'Paga',
  OVERDUE: 'Atrasada',
};

export function getBillEffectiveStatus(bill, today = todayISO()) {
  if (bill.status === BILL_STATUS.PAID) return BILL_STATUS.PAID;
  if (bill.dueDate && bill.dueDate < today) return BILL_STATUS.OVERDUE;
  return BILL_STATUS.OPEN;
}

export async function saveRecurringBill(input) {
  return upsert('recurring_bills', {
    ...input,
    name: input.name?.trim(),
    dueDay: Number(input.dueDay || 1),
    expectedAmount: parseMoney(input.expectedAmount),
    type: input.type || 'fixa',
    active: Boolean(input.active),
    notifyBefore: Boolean(input.notifyBefore),
    notifyDaysBefore: Number(input.notifyDaysBefore || 3),
  });
}

export async function saveMonthlyBill(input) {
  const status = input.status || BILL_STATUS.OPEN;
  return upsert('monthly_bills', {
    ...input,
    name: input.name?.trim(),
    month: input.month,
    dueDate: input.dueDate,
    expectedAmount: parseMoney(input.expectedAmount),
    paidAmount: status === BILL_STATUS.PAID ? parseMoney(input.paidAmount || input.expectedAmount) : parseMoney(input.paidAmount),
    paidAt: status === BILL_STATUS.PAID ? input.paidAt || todayISO() : input.paidAt || null,
    status,
    source: input.source || 'manual',
  });
}

export async function markBillPaid(id, paidAmount, paidAt = todayISO()) {
  const bill = await getById('monthly_bills', id);
  if (!bill) throw new Error('Conta não encontrada.');

  return upsert('monthly_bills', {
    ...bill,
    paidAmount: parseMoney(paidAmount || bill.expectedAmount),
    paidAt,
    status: BILL_STATUS.PAID,
  });
}

export async function deleteMonthlyBill(id) {
  return remove('monthly_bills', id);
}

export async function deleteRecurringBill(id) {
  return remove('recurring_bills', id);
}

export async function ensureBillsForMonth(month) {
  const [recurringBills, monthlyBills] = await Promise.all([getAll('recurring_bills'), getAll('monthly_bills')]);
  const activeRecurring = recurringBills.filter((bill) => bill.active !== false);
  const created = [];

  for (const recurring of activeRecurring) {
    const alreadyExists = monthlyBills.some((bill) => bill.month === month && bill.recurringBillId === recurring.id);
    if (alreadyExists) continue;

    const generated = await saveMonthlyBill({
      name: recurring.name,
      categoryId: recurring.categoryId,
      month,
      dueDate: dateFromMonthDay(month, recurring.dueDay),
      expectedAmount: recurring.expectedAmount,
      paidAmount: 0,
      status: BILL_STATUS.OPEN,
      notes: recurring.notes || '',
      source: 'recurring',
      recurringBillId: recurring.id,
      recurringType: recurring.type,
      notifyBefore: recurring.notifyBefore,
      notifyDaysBefore: recurring.notifyDaysBefore,
    });
    created.push(generated);
  }

  return created;
}
