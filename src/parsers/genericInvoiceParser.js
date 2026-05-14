import { normalizeInvoiceDate } from '../utils/dateUtils.js';
import { parseMoney } from '../utils/moneyUtils.js';
import { normalizeText } from '../utils/textUtils.js';

const LINE_REGEX = /^\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.+?)\s+(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+(?:[,.]\d{2})?)\s*$/i;
const CARD_PAYMENT_TERMS = ['pagamentos validos normais', 'pagamento valido normal', 'pagamento fatura', 'pagamento recebido'];

function normalizeYear(dateText) {
  return dateText.replace(/\/(\d{2})$/, (_match, year) => `/20${year}`);
}

function parseSeparatedLine(line, referenceMonth) {
  const separator = line.includes(';') ? ';' : line.includes('\t') ? '\t' : null;
  if (!separator) return null;

  const parts = line
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return null;

  const firstColumn = normalizeText(parts[0]);
  if (firstColumn === 'data') {
    return { skip: true, reason: 'header' };
  }

  if (separator === ';' && parts.length >= 4) {
    const [dateText, establishment, cardHolder, amountText, installmentText = '-'] = parts;
    const date = normalizeInvoiceDate(normalizeYear(dateText), referenceMonth);
    const description = establishment.replace(/\s+/g, ' ').trim();
    const amount = parseMoney(amountText);
    const normalizedDescription = normalizeText(description);

    if (CARD_PAYMENT_TERMS.some((term) => normalizedDescription.includes(term))) {
      return { skip: true, reason: 'payment', sourceLine: line };
    }

    if (!date || !description || amount === 0) return null;

    const installmentMatch = String(installmentText).match(/(\d+)\s*de\s*(\d+)/i);
    return {
      date,
      description,
      amount,
      installmentNumber: installmentMatch ? Number(installmentMatch[1]) : 1,
      installments: installmentMatch ? Number(installmentMatch[2]) : 1,
      notes: cardHolder ? `Portador: ${cardHolder}` : '',
    };
  }

  if (parts.length < 3) return null;

  const [dateText, ...rest] = parts;
  const amountText = rest.pop();
  const description = rest.join(' ');
  const date = normalizeInvoiceDate(normalizeYear(dateText), referenceMonth);
  const amount = parseMoney(amountText);

  if (!date || !description || amount === 0) return null;
  return { date, description, amount };
}

function parseTextLine(line, referenceMonth) {
  const match = line.match(LINE_REGEX);
  if (!match) return null;

  const [, rawDate, rawDescription, rawAmount] = match;
  const date = normalizeInvoiceDate(normalizeYear(rawDate), referenceMonth);
  const description = rawDescription.replace(/\s+/g, ' ').trim();
  const amount = parseMoney(rawAmount);

  if (!date || !description || amount === 0) return null;
  return { date, description, amount };
}

export function parseGenericInvoice(text, context = {}) {
  const referenceMonth = context.month;
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const transactions = [];
  const rejectedLines = [];
  const skippedLines = [];

  lines.forEach((line, index) => {
    const parsed = parseSeparatedLine(line, referenceMonth) || parseTextLine(line, referenceMonth);
    if (parsed?.skip) {
      skippedLines.push({ lineNumber: index + 1, line, reason: parsed.reason });
      return;
    }

    if (parsed) {
      transactions.push({
        sourceLine: line,
        lineNumber: index + 1,
        description: parsed.description,
        amount: parsed.amount,
        purchaseDate: parsed.date,
        invoiceMonth: referenceMonth,
        installments: parsed.installments || 1,
        installmentNumber: parsed.installmentNumber || 1,
        notes: parsed.notes || '',
      });
    } else {
      rejectedLines.push({ lineNumber: index + 1, line });
    }
  });

  const usefulLineCount = Math.max(1, lines.length - skippedLines.length);
  const usableRatio = transactions.length / usefulLineCount;
  const ok = transactions.length > 0 && usableRatio >= 0.5;

  return {
    ok,
    parserId: 'generic-line-date-description-amount',
    parserName: 'Genérico: DATA DESCRIÇÃO VALOR',
    transactions,
    rejectedLines,
    skippedLines,
    message: ok
      ? `${transactions.length} lançamento(s) encontrado(s). ${skippedLines.length ? `${skippedLines.length} linha(s) ignorada(s), como cabeçalho ou pagamento de fatura. ` : ''}Confira tudo antes de salvar.`
      : 'Formato de fatura ainda não reconhecido. Ajuste o texto ou cadastre um modelo de importação.',
  };
}
