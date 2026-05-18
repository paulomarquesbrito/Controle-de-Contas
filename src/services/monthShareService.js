import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { BILL_STATUS } from './billService.js';
import { INVOICE_STATUS } from './cardService.js';
import { billsForMonth } from './financeSelectors.js';
import { getInvoiceMeta } from './invoiceService.js';
import { formatMoney } from '../utils/moneyUtils.js';
import { pad } from '../utils/dateUtils.js';

function dueDayFromDate(date) {
  const day = Number(String(date || '').slice(8, 10));
  return Number.isFinite(day) && day > 0 ? day : 1;
}

function paidAmountOrFallback(primary, fallback) {
  const primaryValue = Number(primary || 0);
  if (primaryValue > 0) return primaryValue;
  return Number(fallback || 0);
}

function cardDisplayName(cardName) {
  const name = String(cardName || 'Cartão').trim();
  return /^cart[aã]o/i.test(name) ? name : `Cartão ${name}`;
}

function formatLine(item) {
  const paidMark = item.paid ? '✅' : '';
  const amount = item.paid ? formatMoney(item.paidAmount) : 'R$';
  return `${paidMark}${item.name} - Dia ${pad(item.dueDay)} - ${amount}`;
}

export function buildMonthlyAccountsShareText(data, month) {
  const billItems = billsForMonth(data.monthly_bills || [], month).map((bill, index) => {
    const paid = bill.effectiveStatus === BILL_STATUS.PAID;
    return {
      kind: 'bill',
      order: index,
      name: bill.name,
      dueDay: dueDayFromDate(bill.dueDate),
      paid,
      paidAmount: paid ? paidAmountOrFallback(bill.paidAmount, bill.expectedAmount) : 0,
    };
  });

  const cardItems = (data.cards || [])
    .filter((card) => card.active !== false)
    .map((card, index) => {
      const invoice = getInvoiceMeta(card, month, data.card_invoices || [], data.card_transactions || []);
      const paid = invoice.status === INVOICE_STATUS.PAID;
      return {
        kind: 'card',
        order: billItems.length + index,
        name: cardDisplayName(card.name),
        dueDay: Number(card.dueDay || dueDayFromDate(invoice.dueDate)),
        paid,
        paidAmount: paid ? paidAmountOrFallback(invoice.paidAmount, invoice.total) : 0,
      };
    });

  return [...billItems, ...cardItems]
    .sort((a, b) => a.dueDay - b.dueDay || a.order - b.order)
    .map(formatLine)
    .join('\n');
}

async function copyToClipboard(text) {
  if (!navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(text);
  return true;
}

export async function shareMonthlyAccountsText(text) {
  if (!text.trim()) {
    return 'Não há contas ou cartões para compartilhar neste mês.';
  }

  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title: 'Contas do mês',
      text,
      dialogTitle: 'Enviar contas do mês',
    });
    return 'Escolha o WhatsApp para enviar a lista.';
  }

  if (navigator.share) {
    await navigator.share({
      title: 'Contas do mês',
      text,
    });
    return 'Lista compartilhada.';
  }

  await copyToClipboard(text).catch(() => false);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  return 'Texto copiado e WhatsApp aberto. Escolha o contato e envie.';
}
