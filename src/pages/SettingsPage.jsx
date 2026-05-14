import { Bell, Cloud, Download, KeyRound, Pencil, Save, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { SelectField, TextArea, TextField, ToggleField } from '../components/FormField.jsx';
import { createBackupPayload, downloadBackup, readBackupFile, restoreBackup } from '../db/backupService.js';
import { clearAllData, ensureInitialData } from '../db/indexedDb.js';
import { deleteCategoryIfUnused, deleteLearnedRule, saveCategory, saveLearnedRule } from '../services/categoryService.js';
import { downloadFromGithub, getGithubSyncConfig, saveGithubSyncConfig, uploadToGithub } from '../services/githubSyncService.js';
import { getNotificationSupport, requestNotificationPermission, saveNotificationSettings } from '../services/notificationService.js';

function Section({ title, description, children }) {
  return (
    <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft">
      <div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Sheet({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-lift">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function SettingsPage({ data, refresh, showToast, pwaInstall }) {
  const [categoryForm, setCategoryForm] = useState(null);
  const [ruleForm, setRuleForm] = useState(null);
  const [pendingBackup, setPendingBackup] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmForceUpload, setConfirmForceUpload] = useState(false);
  const [notificationForm, setNotificationForm] = useState(data.notification_settings?.[0] || { id: 'default', enabled: false });
  const [syncForm, setSyncForm] = useState({
    owner: '',
    repo: '',
    branch: 'main',
    path: 'data/encrypted-finance-data.json',
    token: '',
    rememberPassword: false,
    savedPassword: '',
    lastSha: null,
    lastSyncedAt: null,
  });
  const [syncPassword, setSyncPassword] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const support = getNotificationSupport();

  useEffect(() => {
    setNotificationForm(data.notification_settings?.[0] || { id: 'default', enabled: false });
  }, [data.notification_settings]);

  useEffect(() => {
    getGithubSyncConfig()
      .then((config) => {
        setSyncForm(config);
        if (config.rememberPassword && config.savedPassword) {
          setSyncPassword(config.savedPassword);
        }
      })
      .catch(() => {});
  }, [data.settings]);

  async function exportBackup() {
    const payload = await createBackupPayload();
    downloadBackup(payload);
    await saveNotificationSettings({ ...notificationForm, lastBackupAt: new Date().toISOString() });
    await refresh();
    showToast('Backup exportado.');
  }

  async function selectBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await readBackupFile(file);
    if (!result.validation.valid) {
      showToast(result.validation.message);
      return;
    }
    setPendingBackup(result.payload);
  }

  async function confirmRestore() {
    await restoreBackup(pendingBackup);
    setPendingBackup(null);
    await refresh({ skipGeneration: true });
    showToast('Backup importado. Os dados atuais foram substituídos.');
  }

  async function clearData() {
    await clearAllData();
    await ensureInitialData();
    setConfirmClear(false);
    await refresh();
    showToast('Dados limpos e categorias padrão recriadas.');
  }

  async function submitCategory(event) {
    event.preventDefault();
    await saveCategory(categoryForm);
    setCategoryForm(null);
    await refresh();
    showToast('Categoria salva.');
  }

  async function submitRule(event) {
    event.preventDefault();
    await saveLearnedRule(ruleForm);
    setRuleForm(null);
    await refresh();
    showToast('Regra aprendida salva.');
  }

  async function confirmDeleteItem() {
    try {
      if (confirmDelete.kind === 'category') {
        await deleteCategoryIfUnused(confirmDelete.id);
        showToast('Categoria excluída.');
      } else {
        await deleteLearnedRule(confirmDelete.id);
        showToast('Regra excluída.');
      }
      setConfirmDelete(null);
      await refresh();
    } catch (error) {
      showToast(error.message);
      setConfirmDelete(null);
    }
  }

  async function requestPermission() {
    const result = await requestNotificationPermission();
    showToast(result.message);
  }

  async function saveNotifications() {
    await saveNotificationSettings(notificationForm);
    await refresh();
    showToast('Configurações de notificação salvas.');
  }

  async function installPwa() {
    const result = await pwaInstall.promptInstall();
    showToast(result.message);
  }

  async function saveSyncConfig() {
    const saved = await saveGithubSyncConfig({
      ...syncForm,
      savedPassword: syncForm.rememberPassword ? syncPassword : '',
    });
    setSyncForm(saved);
    await refresh();
    showToast('Configuração do cofre salva neste aparelho.');
  }

  async function saveSyncedConfig(config) {
    const saved = await saveGithubSyncConfig({
      ...config,
      rememberPassword: syncForm.rememberPassword,
      savedPassword: syncForm.rememberPassword ? syncPassword : '',
    });
    setSyncForm(saved);
    return saved;
  }

  async function downloadVault() {
    setSyncBusy(true);
    try {
      const result = await downloadFromGithub(syncForm, syncPassword);
      await saveSyncedConfig(result.config);
      await refresh({ skipGeneration: true });
      showToast('Cofre baixado e aplicado neste aparelho.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSyncBusy(false);
    }
  }

  async function uploadVault(force = false) {
    setSyncBusy(true);
    try {
      const result = await uploadToGithub(syncForm, syncPassword, { force });
      await saveSyncedConfig(result.config);
      setConfirmForceUpload(false);
      await refresh();
      showToast('Cofre criptografado enviado ao GitHub.');
    } catch (error) {
      if (error.code === 'REMOTE_CHANGED') {
        setConfirmForceUpload(true);
      }
      showToast(error.message);
    } finally {
      setSyncBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Section title="Segurança local" description="O app não envia dados para servidor, não tem login, não usa analytics e salva tudo no IndexedDB deste dispositivo.">
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-3 text-emerald-900">
          <ShieldCheck size={22} className="mt-1 shrink-0" />
          <p className="text-sm leading-relaxed">
            Se você apagar os dados do navegador ou trocar de aparelho sem backup, pode perder suas informações.
          </p>
        </div>
      </Section>

      <Section title="Instalação do PWA" description="Para instalar, abra a versão de produção e use este botão quando aparecer, ou o menu do navegador.">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
          <p><b>Status:</b> {pwaInstall.installed ? 'app já está em modo instalado' : pwaInstall.canInstall ? 'pronto para instalar' : 'instalação ainda não liberada pelo navegador'}</p>
          <p><b>Contexto seguro:</b> {pwaInstall.secureContext ? 'sim' : 'não'}</p>
          <p className="mt-2">
            No celular, acessar por IP local com HTTP pode impedir a instalação. Nesse caso, use o menu do Chrome/Safari ou teste em um endereço HTTPS.
          </p>
        </div>
        <button
          type="button"
          onClick={installPwa}
          disabled={!pwaInstall.canInstall || pwaInstall.installed}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white disabled:bg-slate-300"
        >
          <Download size={18} /> {pwaInstall.installed ? 'App instalado' : 'Instalar app'}
        </button>
      </Section>

      <Section title="Backup manual" description="Exporte um arquivo JSON completo. Importar backup substitui todos os dados atuais.">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={exportBackup} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white">
            <Download size={18} /> Exportar
          </button>
          <label className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-100 font-black text-sky-800">
            <Upload size={18} /> Importar
            <input type="file" accept="application/json,.json" className="hidden" onChange={selectBackup} />
          </label>
        </div>
      </Section>

      <Section title="Cofre familiar no GitHub" description="Sincroniza um arquivo criptografado em um repositório privado. A senha não é enviada ao GitHub.">
        <div className="rounded-2xl bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900">
          <p className="font-black">Regra de uso</p>
          <p>Antes de mexer: baixe do GitHub. Depois de mexer: envie para o GitHub. Evitem editar ao mesmo tempo.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Usuário/owner" value={syncForm.owner || ''} onChange={(owner) => setSyncForm({ ...syncForm, owner })} />
          <TextField label="Repositório" value={syncForm.repo || ''} onChange={(repo) => setSyncForm({ ...syncForm, repo })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Branch" value={syncForm.branch || 'main'} onChange={(branch) => setSyncForm({ ...syncForm, branch })} />
          <TextField label="Arquivo" value={syncForm.path || ''} onChange={(path) => setSyncForm({ ...syncForm, path })} />
        </div>
        <TextField
          label="Token fine-grained do GitHub"
          type="password"
          value={syncForm.token || ''}
          onChange={(token) => setSyncForm({ ...syncForm, token })}
          placeholder="github_pat_..."
        />
        <TextField
          label="Senha do cofre"
          type="password"
          value={syncPassword}
          onChange={(password) => {
            setSyncPassword(password);
            if (syncForm.rememberPassword) {
              setSyncForm({ ...syncForm, savedPassword: password });
            }
          }}
          placeholder="Senha combinada com sua esposa"
        />
        <ToggleField
          label="Salvar senha neste dispositivo"
          description="Use apenas no seu celular ou computador de confiança. A senha fica salva localmente neste aparelho."
          checked={Boolean(syncForm.rememberPassword)}
          onChange={(rememberPassword) =>
            setSyncForm({
              ...syncForm,
              rememberPassword,
              savedPassword: rememberPassword ? syncPassword : '',
            })
          }
        />
        <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <p><b>Última sincronização:</b> {syncForm.lastSyncedAt ? new Date(syncForm.lastSyncedAt).toLocaleString('pt-BR') : 'nunca'}</p>
          <p><b>Arquivo remoto:</b> {syncForm.path || 'data/encrypted-finance-data.json'}</p>
        </div>
        <button type="button" onClick={saveSyncConfig} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 font-black text-slate-700">
          <KeyRound size={18} /> Salvar configuração local
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={downloadVault}
            disabled={syncBusy}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-100 font-black text-sky-800 disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Download size={18} /> Baixar
          </button>
          <button
            type="button"
            onClick={() => uploadVault(false)}
            disabled={syncBusy}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white disabled:bg-slate-300"
          >
            <Cloud size={18} /> Enviar
          </button>
        </div>
      </Section>

      <Section title="Notificações" description="Os avisos internos funcionam sempre. Notificações do sistema dependem do navegador, permissão e contexto seguro.">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          <p><b>Suporte:</b> {support.supported ? 'disponível' : 'limitado neste endereço/navegador'}</p>
          <p><b>Permissão:</b> {support.permission}</p>
        </div>
        <ToggleField label="Ativar notificações locais" checked={Boolean(notificationForm.enabled)} onChange={(enabled) => setNotificationForm({ ...notificationForm, enabled })} />
        <ToggleField label="Avisar contas próximas" checked={Boolean(notificationForm.billsBeforeDue)} onChange={(billsBeforeDue) => setNotificationForm({ ...notificationForm, billsBeforeDue })} />
        <ToggleField label="Avisar contas atrasadas" checked={Boolean(notificationForm.overdueBills)} onChange={(overdueBills) => setNotificationForm({ ...notificationForm, overdueBills })} />
        <ToggleField label="Avisar faturas próximas" checked={Boolean(notificationForm.invoicesBeforeDue)} onChange={(invoicesBeforeDue) => setNotificationForm({ ...notificationForm, invoicesBeforeDue })} />
        <TextField
          label="Dias antes do vencimento"
          type="number"
          min="1"
          max="30"
          value={notificationForm.daysBeforeDue || 3}
          onChange={(daysBeforeDue) => setNotificationForm({ ...notificationForm, daysBeforeDue })}
        />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={requestPermission} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 font-black text-slate-700">
            <Bell size={18} /> Permissão
          </button>
          <button type="button" onClick={saveNotifications} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-black text-white">
            <Save size={18} /> Salvar
          </button>
        </div>
      </Section>

      <Section title="Categorias" description="Categorias ajudam nos relatórios e na sugestão automática de gastos.">
        <button
          type="button"
          onClick={() => setCategoryForm({ name: '', icon: '📌', color: '#0f766e', type: 'expense', keywords: '' })}
          className="min-h-12 w-full rounded-2xl bg-emerald-600 font-black text-white"
        >
          Nova categoria
        </button>
        <div className="space-y-2">
          {[...(data.categories || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).map((category) => (
            <article key={category.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {category.icon} {category.name}
                </p>
                <p className="truncate text-xs text-slate-500">{(category.keywords || []).join(', ') || 'Sem palavras-chave'}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCategoryForm({ ...category, keywords: (category.keywords || []).join(', ') })} className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => setConfirmDelete({ kind: 'category', id: category.id })} className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Regras aprendidas" description="Quando você corrige uma categoria na importação, o app aprende para as próximas faturas.">
        {(data.learned_category_rules || []).length ? (
          data.learned_category_rules.map((rule) => {
            const category = data.categories.find((item) => item.id === rule.categoryId);
            return (
              <article key={rule.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{rule.keywordNormalized}</p>
                  <p className="text-xs text-slate-500">
                    {category?.name || 'Categoria removida'} • {rule.usageCount || 0} uso(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRuleForm(rule)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-700">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => setConfirmDelete({ kind: 'rule', id: rule.id })} className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Nenhuma regra aprendida ainda.</p>
        )}
      </Section>

      <Section title="Cartões" description="O cadastro e os lançamentos ficam na aba Cartões, mas você pode conferir aqui quais cartões existem.">
        {(data.cards || []).length ? (
          data.cards.map((card) => (
            <div key={card.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{card.name}</p>
                <p className="text-xs text-slate-500">{card.issuer || 'Sem emissor'} • vence dia {card.dueDay}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${card.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                {card.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Nenhum cartão cadastrado.</p>
        )}
      </Section>

      <Section title="Dados do app" description="Use apenas quando quiser apagar tudo deste dispositivo.">
        <button type="button" onClick={() => setConfirmClear(true)} className="min-h-12 w-full rounded-2xl bg-rose-600 font-black text-white">
          Limpar todos os dados
        </button>
      </Section>

      {categoryForm ? (
        <Sheet title={categoryForm.id ? 'Editar categoria' : 'Nova categoria'} onClose={() => setCategoryForm(null)}>
          <form onSubmit={submitCategory} className="space-y-3">
            <TextField label="Nome" value={categoryForm.name} onChange={(name) => setCategoryForm({ ...categoryForm, name })} required />
            <TextField label="Ícone" value={categoryForm.icon} onChange={(icon) => setCategoryForm({ ...categoryForm, icon })} />
            <TextField label="Cor" type="color" value={categoryForm.color} onChange={(color) => setCategoryForm({ ...categoryForm, color })} />
            <SelectField label="Tipo" value={categoryForm.type} onChange={(type) => setCategoryForm({ ...categoryForm, type })}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </SelectField>
            <TextArea label="Palavras-chave separadas por vírgula" value={categoryForm.keywords || ''} onChange={(keywords) => setCategoryForm({ ...categoryForm, keywords })} />
            <TextField label="Ordem" type="number" value={categoryForm.order || 0} onChange={(order) => setCategoryForm({ ...categoryForm, order })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Salvar categoria
            </button>
          </form>
        </Sheet>
      ) : null}

      {ruleForm ? (
        <Sheet title="Editar regra aprendida" onClose={() => setRuleForm(null)}>
          <form onSubmit={submitRule} className="space-y-3">
            <TextField label="Texto original" value={ruleForm.originalText || ''} onChange={(originalText) => setRuleForm({ ...ruleForm, originalText })} />
            <TextField label="Palavra-chave normalizada" value={ruleForm.keywordNormalized || ''} onChange={(keywordNormalized) => setRuleForm({ ...ruleForm, keywordNormalized })} />
            <SelectField label="Categoria escolhida" value={ruleForm.categoryId} onChange={(categoryId) => setRuleForm({ ...ruleForm, categoryId })}>
              {data.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Quantidade de usos" type="number" min="0" value={ruleForm.usageCount || 0} onChange={(usageCount) => setRuleForm({ ...ruleForm, usageCount })} />
            <button type="submit" className="min-h-14 w-full rounded-2xl bg-emerald-600 px-4 py-4 font-black text-white">
              Salvar regra
            </button>
          </form>
        </Sheet>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingBackup)}
        danger
        title="Substituir todos os dados?"
        message="Atenção: importar este backup vai apagar todos os dados atuais do app e substituir pelos dados do arquivo. Faça uma exportação antes se quiser guardar os dados atuais."
        confirmLabel="Confirmar substituição"
        onCancel={() => setPendingBackup(null)}
        onConfirm={confirmRestore}
      />

      <ConfirmModal
        open={confirmClear}
        danger
        title="Limpar todos os dados?"
        message="Esta ação apaga contas, cartões, faturas, categorias, regras aprendidas e histórico local deste dispositivo."
        confirmLabel="Limpar tudo"
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearData}
      />

      <ConfirmModal
        open={Boolean(confirmDelete)}
        danger
        title="Excluir item?"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />

      <ConfirmModal
        open={confirmForceUpload}
        danger
        title="Sobrescrever cofre remoto?"
        message="O arquivo no GitHub mudou desde a última sincronização deste aparelho. O mais seguro é baixar primeiro. Use envio forçado apenas se tiver certeza de que quer substituir o cofre remoto pelos dados atuais deste aparelho."
        confirmLabel="Forçar envio"
        onCancel={() => setConfirmForceUpload(false)}
        onConfirm={() => uploadVault(true)}
      />
    </div>
  );
}
