export function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export function toCents(value) {
  return Math.round(parseMoney(value) * 100);
}

export function fromCents(cents) {
  return Math.round(Number(cents || 0)) / 100;
}

export function splitInstallments(total, installments) {
  const count = Math.max(1, Number(installments || 1));
  const totalCents = toCents(total);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return Array.from({ length: count }, (_, index) => fromCents(base + (index < remainder ? 1 : 0)));
}
