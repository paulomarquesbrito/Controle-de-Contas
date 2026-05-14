import { addMonths, daysBetween, formatDate, todayISO } from '../utils/dateUtils.js';
import { getBillEffectiveStatus, BILL_STATUS } from './billService.js';
import { getInvoiceMeta, getInvoiceTransactions } from './invoiceService.js';
import { getAccumulatedSavings, getSavingsForMonth } from './savingsService.js';

export function billsForMonth(monthlyBills, month) {
  return monthlyBills
    .filter((bill) => bill.month === month)
    .map((bill) => ({ ...bill, effectiveStatus: getBillEffectiveStatus(bill) }))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
}

export function transactionsForMonth(transactions, month) {
  return transactions
    .filter((transaction) => transaction.invoiceMonth === month)
    .sort((a, b) => String(a.purchaseDate).localeCompare(String(b.purchaseDate)));
}

export function buildMonthSummary(data, month) {
  const bills = billsForMonth(data.monthly_bills || [], month);
  const transactions = transactionsForMonth(data.card_transactions || [], month);
  const savings = getSavingsForMonth(data.savings || [], month);
  const paidBillsTotal = bills
    .filter((bill) => bill.effectiveStatus === BILL_STATUS.PAID)
    .reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
  const openBillsTotal = bills
    .filter((bill) => bill.effectiveStatus === BILL_STATUS.OPEN)
    .reduce((sum, bill) => sum + Number(bill.expectedAmount || 0), 0);
  const overdueBillsTotal = bills
    .filter((bill) => bill.effectiveStatus === BILL_STATUS.OVERDUE)
    .reduce((sum, bill) => sum + Number(bill.expectedAmount || 0), 0);
  const billsTotal = bills.reduce(
    (sum, bill) => sum + Number(bill.effectiveStatus === BILL_STATUS.PAID ? bill.paidAmount : bill.expectedAmount || 0),
    0,
  );
  const cardsTotal = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const savedAmount = Number(savings.savedAmount || 0);
  const withdrawnAmount = Number(savings.withdrawnAmount || 0);
  const savingsNet = savedAmount - withdrawnAmount;

  return {
    bills,
    transactions,
    billsTotal,
    paidBillsTotal,
    openBillsTotal,
    overdueBillsTotal,
    cardsTotal,
    monthTotal: billsTotal + cardsTotal,
    savedAmount,
    withdrawnAmount,
    savingsNet,
    accumulatedSavings: getAccumulatedSavings(data.savings || [], month),
    topCategories: summarizeMonthCategories(data, month),
    cards: summarizeCards(data, month),
    upcomingBills: upcomingBills(bills),
    alerts: buildAlerts(data, month),
  };
}

export function summarizeMonthCategories(data, month) {
  const categories = data.categories || [];
  const bills = billsForMonth(data.monthly_bills || [], month);
  const transactions = transactionsForMonth(data.card_transactions || [], month);

  return categories
    .map((category) => {
      const billsTotal = bills
        .filter((bill) => bill.categoryId === category.id)
        .reduce((sum, bill) => sum + Number(bill.effectiveStatus === BILL_STATUS.PAID ? bill.paidAmount : bill.expectedAmount || 0), 0);
      const cardTotal = transactions
        .filter((transaction) => transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      return { category, total: billsTotal + cardTotal };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function summarizeCards(data, month) {
  const cards = data.cards || [];
  return cards
    .filter((card) => card.active !== false)
    .map((card) => getInvoiceMeta(card, month, data.card_invoices || [], data.card_transactions || []))
    .sort((a, b) => b.total - a.total);
}

export function upcomingBills(bills, days = 7) {
  const today = todayISO();
  return bills
    .filter((bill) => bill.effectiveStatus !== BILL_STATUS.PAID)
    .filter((bill) => {
      const diff = daysBetween(today, bill.dueDate);
      return diff >= 0 && diff <= days;
    })
    .slice(0, 5);
}

export function buildAlerts(data, month) {
  const alerts = [];
  const today = todayISO();
  const notificationSettings = data.notification_settings?.[0] || {};
  const daysBeforeDue = Number(notificationSettings.daysBeforeDue || 3);
  const bills = billsForMonth(data.monthly_bills || [], month);
  const cards = data.cards || [];
  const transactions = data.card_transactions || [];
  const invoices = data.card_invoices || [];

  bills
    .filter((bill) => bill.effectiveStatus === BILL_STATUS.OVERDUE)
    .forEach((bill) => alerts.push({ type: 'danger', title: 'Conta vencida', message: `${bill.name} venceu em ${formatDate(bill.dueDate)}.` }));

  bills
    .filter((bill) => bill.effectiveStatus === BILL_STATUS.OPEN && daysBetween(today, bill.dueDate) >= 0 && daysBetween(today, bill.dueDate) <= daysBeforeDue)
    .forEach((bill) =>
      alerts.push({ type: 'warning', title: 'Conta próxima do vencimento', message: `${bill.name} vence em ${formatDate(bill.dueDate)}.` }),
    );

  bills
    .filter((bill) => bill.status === BILL_STATUS.PAID && !Number(bill.paidAmount))
    .forEach((bill) => alerts.push({ type: 'warning', title: 'Valor real ausente', message: `${bill.name} está paga, mas sem valor real.` }));

  cards.forEach((card) => {
    const invoice = getInvoiceMeta(card, month, invoices, transactions);
    const diff = daysBetween(today, invoice.dueDate);
    if (invoice.status === 'Atrasada') {
      alerts.push({ type: 'danger', title: 'Fatura atrasada', message: `A fatura de ${card.name} venceu em ${formatDate(invoice.dueDate)}.` });
    } else if (invoice.total > 0 && diff >= 0 && diff <= daysBeforeDue) {
      alerts.push({ type: 'warning', title: 'Fatura próxima do vencimento', message: `${card.name} vence em ${formatDate(invoice.dueDate)}.` });
    }
  });

  const openCount = bills.filter((bill) => bill.effectiveStatus !== BILL_STATUS.PAID).length;
  if (openCount) {
    alerts.push({ type: 'info', title: 'Mês com contas em aberto', message: `Existem ${openCount} conta(s) ainda não pagas neste mês.` });
  }

  const lastBackup = notificationSettings?.lastBackupAt;
  if (!lastBackup || daysBetween(lastBackup.slice(0, 10), today) >= 15) {
    alerts.push({ type: 'info', title: 'Lembrete de backup', message: 'Exporte um backup JSON para proteger seus dados locais.' });
  }

  return alerts;
}

export function buildMonthlyReport(data, monthsBack = 6, anchorMonth = todayISO().slice(0, 7)) {
  const months = Array.from({ length: monthsBack }, (_, index) => addMonths(anchorMonth, index - (monthsBack - 1)));

  return months.map((month) => {
    const summary = buildMonthSummary(data, month);
    return {
      month,
      total: summary.monthTotal,
      bills: summary.billsTotal,
      cards: summary.cardsTotal,
      saved: summary.savedAmount,
      withdrawn: summary.withdrawnAmount,
      savingsNet: summary.savingsNet,
      accumulatedSavings: summary.accumulatedSavings,
    };
  });
}

export function getTransactionsByCardForInvoice(data, cardId, month) {
  return getInvoiceTransactions(data.card_transactions || [], cardId, month);
}
