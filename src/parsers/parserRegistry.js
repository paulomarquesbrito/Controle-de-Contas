import { parseGenericInvoice } from './genericInvoiceParser.js';

const PARSERS = [
  {
    id: 'generic',
    name: 'Genérico',
    parse: parseGenericInvoice,
  },
];

export function parseInvoiceText(text, context) {
  for (const parser of PARSERS) {
    const result = parser.parse(text, context);
    if (result.ok) {
      return {
        ...result,
        parserRegistryId: parser.id,
      };
    }
  }

  return {
    ok: false,
    parserId: null,
    parserName: null,
    parserRegistryId: null,
    transactions: [],
    rejectedLines: [],
    message: 'Formato de fatura ainda não reconhecido. Ajuste o texto ou cadastre um modelo de importação.',
  };
}

export function getAvailableParsers() {
  return PARSERS.map(({ id, name }) => ({ id, name }));
}
