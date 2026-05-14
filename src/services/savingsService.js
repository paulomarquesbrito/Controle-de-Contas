import { getById, upsert } from '../db/indexedDb.js';
import { parseMoney } from '../utils/moneyUtils.js';

export function savingsId(month) {
  return `savings_${month}`;
}

export async function saveSavingsMonth(input) {
  const existing = await getById('savings', savingsId(input.month));
  return upsert('savings', {
    ...(existing || {}),
    id: savingsId(input.month),
    month: input.month,
    savedAmount: parseMoney(input.savedAmount),
    withdrawnAmount: parseMoney(input.withdrawnAmount),
    notes: input.notes || '',
  });
}

export function getSavingsForMonth(savings, month) {
  return savings.find((item) => item.month === month) || {
    id: savingsId(month),
    month,
    savedAmount: 0,
    withdrawnAmount: 0,
    notes: '',
  };
}

export function getAccumulatedSavings(savings, upToMonth) {
  return savings
    .filter((item) => item.month <= upToMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .reduce((sum, item) => sum + Number(item.savedAmount || 0) - Number(item.withdrawnAmount || 0), 0);
}
