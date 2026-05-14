const STOP_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'a',
  'o',
  'os',
  'as',
  'e',
  'em',
  'no',
  'na',
  'por',
  'para',
  'pag',
  'pagamento',
  'compra',
  'loja',
]);

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractLearningKeyword(value = '') {
  const normalized = normalizeText(value);
  const words = normalized.split(' ').filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return words.slice(0, 3).join(' ') || normalized;
}

export function includesNormalized(haystack = '', needle = '') {
  const text = normalizeText(haystack);
  const term = normalizeText(needle);
  return Boolean(term) && text.includes(term);
}
