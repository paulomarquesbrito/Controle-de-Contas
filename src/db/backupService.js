import { STORE_NAMES, loadAllData, replaceAllData } from './indexedDb.js';

export async function createBackupPayload() {
  const data = await loadAllData();
  data.settings = (data.settings || []).map((setting) =>
    setting.id === 'github_sync' ? { ...setting, token: '', savedPassword: '' } : setting,
  );

  return {
    app: 'Meu Controle Financeiro',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function validateBackupPayload(payload) {
  if (!payload || payload.app !== 'Meu Controle Financeiro' || !payload.data) {
    return { valid: false, message: 'Este arquivo não parece ser um backup do Meu Controle Financeiro.' };
  }

  const missingStore = STORE_NAMES.find((storeName) => !Array.isArray(payload.data[storeName]));
  if (missingStore) {
    return {
      valid: false,
      message: `Backup inválido: a seção "${missingStore}" não foi encontrada ou está em formato incorreto.`,
    };
  }

  return { valid: true, message: 'Backup válido.' };
}

export function downloadBackup(payload) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup-meu-controle-financeiro-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file) {
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const validation = validateBackupPayload(payload);
    return { payload, validation };
  } catch (error) {
    return {
      payload: null,
      validation: {
        valid: false,
        message: 'Não foi possível ler este arquivo JSON. Verifique se ele não está corrompido.',
      },
    };
  }
}

export async function restoreBackup(payload) {
  const validation = validateBackupPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  await replaceAllData(payload.data);
}
