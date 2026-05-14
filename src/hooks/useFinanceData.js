import { useCallback, useEffect, useState } from 'react';
import { ensureInitialData, loadAllData } from '../db/indexedDb.js';
import { ensureBillsForMonth } from '../services/billService.js';

const EMPTY_DATA = {
  settings: [],
  categories: [],
  recurring_bills: [],
  monthly_bills: [],
  cards: [],
  card_transactions: [],
  card_invoices: [],
  savings: [],
  learned_category_rules: [],
  notification_settings: [],
  import_logs: [],
};

export function useFinanceData(selectedMonth) {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(
    async (options = {}) => {
      setError('');
      try {
        if (!options.skipSeed) {
          await ensureInitialData();
        }
        if (selectedMonth && !options.skipGeneration) {
          await ensureBillsForMonth(selectedMonth);
        }
        const loaded = await loadAllData();
        setData({ ...EMPTY_DATA, ...loaded });
      } catch (err) {
        setError(err.message || 'Não foi possível carregar seus dados locais.');
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth],
  );

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
