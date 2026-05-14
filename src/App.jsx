import { RefreshCw } from 'lucide-react';
import AppLayout from './components/AppLayout.jsx';
import { useFinanceData } from './hooks/useFinanceData.js';
import { usePwaInstallPrompt } from './hooks/usePwaInstallPrompt.js';
import BillsPage from './pages/BillsPage.jsx';
import CardsPage from './pages/CardsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SavingsPage from './pages/SavingsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { currentMonthKey, formatMonth } from './utils/dateUtils.js';
import { useEffect, useMemo, useState } from 'react';

const TITLES = {
  dashboard: 'Início',
  bills: 'Contas',
  cards: 'Cartões',
  savings: 'Guardado',
  reports: 'Relatórios',
  settings: 'Configurações',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [toast, setToast] = useState('');
  const { data, loading, error, refresh } = useFinanceData(selectedMonth);
  const pwaInstall = usePwaInstallPrompt();

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const page = useMemo(() => {
    const props = {
      data,
      selectedMonth,
      onMonthChange: setSelectedMonth,
      refresh,
      showToast: setToast,
    };

    if (activeTab === 'bills') return <BillsPage {...props} />;
    if (activeTab === 'cards') return <CardsPage {...props} />;
    if (activeTab === 'savings') return <SavingsPage {...props} />;
    if (activeTab === 'reports') return <ReportsPage {...props} />;
    if (activeTab === 'settings') return <SettingsPage {...props} pwaInstall={pwaInstall} />;
    return <DashboardPage {...props} />;
  }, [activeTab, data, selectedMonth, refresh, pwaInstall]);

  async function handleManualRefresh() {
    await refresh();
    setToast('Dados locais atualizados.');
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={TITLES[activeTab]}
      subtitle={activeTab === 'settings' ? 'Backup, categorias e segurança' : formatMonth(selectedMonth)}
      action={
        <button
          type="button"
          onClick={handleManualRefresh}
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-emerald-700 shadow-soft"
          aria-label="Recarregar dados locais"
          title="Recarregar dados locais"
        >
          <RefreshCw size={19} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      {error ? <div className="mb-4 rounded-3xl bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div> : null}
      {loading ? (
        <div className="grid min-h-[55vh] place-items-center rounded-3xl bg-white p-8 text-center shadow-soft">
          <div>
            <RefreshCw className="mx-auto animate-spin text-emerald-600" size={32} />
            <p className="mt-3 font-black text-slate-900">Carregando seus dados locais...</p>
            <p className="mt-1 text-sm text-slate-500">Tudo fica salvo somente neste dispositivo.</p>
          </div>
        </div>
      ) : (
        page
      )}
      {toast ? (
        <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-md rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white shadow-lift">
          {toast}
        </div>
      ) : null}
    </AppLayout>
  );
}
