import { ArrowLeft, FileText, Save, SearchCheck, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import CategoryBadge from '../components/CategoryBadge.jsx';
import { SelectField, TextArea, TextField } from '../components/FormField.jsx';
import MoneyInput from '../components/MoneyInput.jsx';
import MonthSelector from '../components/MonthSelector.jsx';
import { upsert } from '../db/indexedDb.js';
import { parseInvoiceText } from '../parsers/parserRegistry.js';
import { learnCategoryFromCorrection, suggestCategory } from '../services/categoryService.js';
import { saveSingleTransaction } from '../services/cardService.js';
import { createId } from '../utils/idUtils.js';
import { formatMoney, parseMoney } from '../utils/moneyUtils.js';

function Step({ number, title, children }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-600 font-black text-white">{number}</span>
        <h2 className="text-base font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function InvoiceImportPage({ data, selectedMonth, onMonthChange, initialCardId, onBack, refresh, showToast }) {
  const [cardId, setCardId] = useState(initialCardId || data.cards[0]?.id || '');
  const [rawText, setRawText] = useState('');
  const [result, setResult] = useState(null);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const selectedCard = data.cards.find((card) => card.id === cardId);
  const total = useMemo(() => rows.reduce((sum, row) => sum + parseMoney(row.amount), 0), [rows]);

  function updateRow(index, patch) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawText(text);
  }

  function validateText() {
    const parsed = parseInvoiceText(rawText, { month: selectedMonth, card: selectedCard });
    setResult(parsed);

    if (!parsed.ok) {
      setRows([]);
      return;
    }

    setRows(
      parsed.transactions.map((transaction) => {
        const category = suggestCategory(transaction.description, data.categories, data.learned_category_rules);
        return {
          tempId: createId('preview'),
          ...transaction,
          cardId,
          invoiceMonth: selectedMonth,
          categoryId: category?.id,
          suggestedCategoryId: category?.id,
        };
      }),
    );
  }

  async function confirmImport() {
    if (!rows.length) return;
    setSaving(true);
    try {
      const importLog = await upsert('import_logs', {
        cardId,
        month: selectedMonth,
        parserId: result.parserId,
        parserName: result.parserName,
        rawText,
        importedCount: rows.length,
      });

      for (const row of rows) {
        if (row.categoryId && row.categoryId !== row.suggestedCategoryId) {
          await learnCategoryFromCorrection(row.description, row.categoryId);
        }
        await saveSingleTransaction({
          description: row.description,
          amount: row.amount,
          purchaseDate: row.purchaseDate,
          categoryId: row.categoryId,
          cardId: row.cardId,
          invoiceMonth: row.invoiceMonth,
          installments: row.installments,
          installmentNumber: row.installmentNumber,
          notes: row.notes,
          source: 'imported',
          importedFromLogId: importLog.id,
        });
      }

      await refresh();
      showToast('Fatura importada após conferência.');
      onBack();
    } catch (error) {
      showToast(error.message || 'Não foi possível salvar a importação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex min-h-12 items-center gap-2 rounded-2xl bg-white px-4 font-black text-slate-700 shadow-soft">
        <ArrowLeft size={18} /> Voltar aos cartões
      </button>

      <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-lift">
        <div className="flex items-start gap-3">
          <FileText size={24} className="mt-1 text-emerald-300" />
          <div>
            <h1 className="text-xl font-black">Importar fatura com conferência</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Nenhum lançamento será salvo automaticamente. Valide, confira, edite e só depois confirme.
            </p>
          </div>
        </div>
      </div>

      <Step number="1" title="Escolher cartão">
        <SelectField label="Cartão" value={cardId} onChange={setCardId}>
          {data.cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name} {card.issuer ? `• ${card.issuer}` : ''}
            </option>
          ))}
        </SelectField>
      </Step>

      <Step number="2" title="Escolher mês da fatura">
        <MonthSelector month={selectedMonth} onChange={onMonthChange} />
      </Step>

      <Step number="3" title="Colar texto ou importar arquivo simples">
        <div className="space-y-3">
          <TextArea
            label="Texto da fatura"
            value={rawText}
            onChange={setRawText}
            placeholder={'Exemplo:\n12/04 MERCADO EXEMPLO 89,90\n12/04/2026 NETFLIX R$ 39,90'}
          />
          <label className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 font-black text-emerald-800">
            <Upload size={18} /> Importar .txt ou .csv simples
            <input type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden" onChange={handleFile} />
          </label>
        </div>
      </Step>

      <Step number="4" title="Validar formato">
        <div className="space-y-3">
          <button
            type="button"
            onClick={validateText}
            disabled={!cardId || !rawText.trim()}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white disabled:bg-slate-300"
          >
            <SearchCheck size={20} /> Validar formato
          </button>
          {result ? (
            <p className={`rounded-2xl p-3 text-sm font-bold ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {result.message}
            </p>
          ) : null}
        </div>
      </Step>

      {rows.length ? (
        <>
          <Step number="5" title="Pré-visualização">
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-600">
                {rows.length} lançamento(s) encontrados • Total {formatMoney(total)}
              </p>
              {rows.slice(0, 4).map((row) => (
                <div key={row.tempId} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{row.description}</p>
                    <p className="text-xs text-slate-500">{row.purchaseDate}</p>
                  </div>
                  <strong>{formatMoney(row.amount)}</strong>
                </div>
              ))}
            </div>
          </Step>

          <Step number="6" title="Conferir e editar tudo">
            <div className="space-y-3">
              {rows.map((row, index) => (
                <article key={row.tempId} className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-slate-900">Lançamento {index + 1}</strong>
                    <CategoryBadge categoryId={row.categoryId} categories={data.categories} />
                  </div>
                  <TextField label="Data" type="date" value={row.purchaseDate} onChange={(purchaseDate) => updateRow(index, { purchaseDate })} />
                  <TextField label="Descrição" value={row.description} onChange={(description) => updateRow(index, { description })} />
                  <MoneyInput label="Valor" value={row.amount} onChange={(amount) => updateRow(index, { amount })} />
                  <SelectField label="Categoria" value={row.categoryId} onChange={(categoryId) => updateRow(index, { categoryId })}>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Cartão" value={row.cardId} onChange={(nextCardId) => updateRow(index, { cardId: nextCardId })}>
                    {data.cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </SelectField>
                  <TextField label="Mês da fatura" type="month" value={row.invoiceMonth} onChange={(invoiceMonth) => updateRow(index, { invoiceMonth })} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextField label="Parcela atual" type="number" min="1" value={row.installmentNumber} onChange={(installmentNumber) => updateRow(index, { installmentNumber })} />
                    <TextField label="Total parcelas" type="number" min="1" value={row.installments} onChange={(installments) => updateRow(index, { installments })} />
                  </div>
                  <TextArea label="Observações" value={row.notes || ''} onChange={(notes) => updateRow(index, { notes })} />
                </article>
              ))}
            </div>
          </Step>

          <Step number="7" title="Salvar somente após confirmar">
            <button
              type="button"
              disabled={saving}
              onClick={confirmImport}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white disabled:bg-slate-300"
            >
              <Save size={20} /> {saving ? 'Salvando...' : 'Confirmar e salvar fatura'}
            </button>
          </Step>
        </>
      ) : null}
    </div>
  );
}
