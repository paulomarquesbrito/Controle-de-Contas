const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

export function pad(value) {
  return String(value).padStart(2, '0');
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function toMonthKey(date = new Date()) {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}`;
}

export function currentMonthKey() {
  return toMonthKey(new Date());
}

export function monthKeyToDate(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function formatMonth(monthKey) {
  const text = MONTH_FORMATTER.format(monthKeyToDate(monthKey));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function addMonths(monthKey, amount) {
  const date = monthKeyToDate(monthKey);
  date.setMonth(date.getMonth() + amount);
  return toMonthKey(date);
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function dateFromMonthDay(monthKey, day) {
  const [year, month] = monthKey.split('-').map(Number);
  const safeDay = Math.min(Math.max(Number(day || 1), 1), daysInMonth(year, month));
  return `${year}-${pad(month)}-${pad(safeDay)}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

export function daysBetween(fromISO, toISO) {
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T00:00:00`);
  return Math.round((to - from) / 86400000);
}

export function normalizeInvoiceDate(dateText, referenceMonth) {
  const parts = String(dateText).split('/').map((part) => Number(part));
  if (parts.length < 2 || !parts[0] || !parts[1]) return '';

  const referenceYear = Number(referenceMonth.split('-')[0]);
  const year = parts[2] || referenceYear;
  const day = Math.min(parts[0], daysInMonth(year, parts[1]));
  return `${year}-${pad(parts[1])}-${pad(day)}`;
}
