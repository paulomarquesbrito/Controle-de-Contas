import { useCallback, useEffect, useState } from 'react';
import { ensureInitialData, loadAllData } from '../db/indexedDb.js';
import { ensureBillsForMonth } from '../services/billService.js';
import { scheduleAutomaticNotifications } from '../services/notificationService.js';
import { addMonths, currentMonthKey } from '../utils/dateUtils.js';

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
        if (!options.skipGeneration) {
          const monthsToGenerate = new Set([currentMonthKey(), addMonths(currentMonthKey(), 1)]);
          if (selectedMonth) monthsToGenerate.add(selectedMonth);
          for (const month of monthsToGenerate) {
            await ensureBillsForMonth(month);
          }
        }
        const loaded = await loadAllData();
        await scheduleAutomaticNotifications({ ...EMPTY_DATA, ...loaded }).catch(() => {});
        const reloaded = await loadAllData();
        setData({ ...EMPTY_DATA, ...reloaded });
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
