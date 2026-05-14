import { createBackupPayload, validateBackupPayload } from '../db/backupService.js';
import { getAll, getById, loadAllData, replaceAllData, upsert } from '../db/indexedDb.js';
import { decryptJson, encryptJson } from './encryptionService.js';

const CONFIG_ID = 'github_sync';
const API_BASE = 'https://api.github.com';

function normalizeConfig(config) {
  return {
    owner: config.owner?.trim(),
    repo: config.repo?.trim(),
    branch: config.branch?.trim() || 'main',
    path: config.path?.trim() || 'data/encrypted-finance-data.json',
    token: config.token?.trim(),
    lastSha: config.lastSha || null,
    lastSyncedAt: config.lastSyncedAt || null,
    lastRemoteUpdatedAt: config.lastRemoteUpdatedAt || null,
  };
}

function validateConfig(config) {
  const normalized = normalizeConfig(config);
  if (!normalized.owner || !normalized.repo || !normalized.branch || !normalized.path || !normalized.token) {
    throw new Error('Preencha usuário, repositório, branch, caminho do arquivo e token do GitHub.');
  }
  return normalized;
}

function encodeContent(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeContent(base64) {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (response.status === 404) {
    return { missing: true, status: 404 };
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `GitHub respondeu com erro ${response.status}.`);
  }

  return body;
}

function fileUrl(config) {
  const path = config.path.split('/').map(encodeURIComponent).join('/');
  return `${API_BASE}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${path}?ref=${encodeURIComponent(config.branch)}`;
}

export async function getGithubSyncConfig() {
  const config = await getById('settings', CONFIG_ID);
  return config || {
    id: CONFIG_ID,
    owner: '',
    repo: '',
    branch: 'main',
    path: 'data/encrypted-finance-data.json',
    token: '',
    lastSha: null,
    lastSyncedAt: null,
    lastRemoteUpdatedAt: null,
  };
}

export async function saveGithubSyncConfig(config) {
  return upsert('settings', {
    ...normalizeConfig(config),
    id: CONFIG_ID,
  });
}

export async function fetchRemoteVault(config) {
  const normalized = validateConfig(config);
  const remote = await githubRequest(fileUrl(normalized), normalized.token);

  if (remote.missing) {
    return { exists: false, sha: null, payload: null, updatedAt: null };
  }

  const text = decodeContent(remote.content || '');
  return {
    exists: true,
    sha: remote.sha,
    payload: JSON.parse(text),
    updatedAt: remote.commit?.committer?.date || null,
  };
}

export async function downloadFromGithub(config, password) {
  const normalized = validateConfig(config);
  const remote = await fetchRemoteVault(normalized);
  if (!remote.exists) {
    throw new Error('Ainda não existe cofre no GitHub. Faça o primeiro envio por um aparelho que já tenha os dados.');
  }

  const backupPayload = await decryptJson(remote.payload, password);
  const validation = validateBackupPayload(backupPayload);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const localNotificationSettings = await getAll('notification_settings');
  const localSyncConfig = await getById('settings', CONFIG_ID);
  const dataToRestore = {
    ...backupPayload.data,
    notification_settings: localNotificationSettings.length
      ? localNotificationSettings
      : backupPayload.data.notification_settings,
    settings: (backupPayload.data.settings || []).filter((item) => item.id !== CONFIG_ID),
  };

  await replaceAllData(dataToRestore);
  const savedConfig = await saveGithubSyncConfig({
    ...(localSyncConfig || {}),
    ...normalized,
    lastSha: remote.sha,
    lastSyncedAt: new Date().toISOString(),
    lastRemoteUpdatedAt: remote.updatedAt,
  });

  return { config: savedConfig, remote };
}

export async function uploadToGithub(config, password, options = {}) {
  const normalized = validateConfig(config);
  const remote = await fetchRemoteVault(normalized);

  if (remote.exists && remote.sha !== normalized.lastSha && !options.force) {
    const error = new Error('O cofre no GitHub mudou desde a última sincronização. Baixe os dados antes de enviar ou use envio forçado.');
    error.code = 'REMOTE_CHANGED';
    error.remote = remote;
    throw error;
  }

  const backupPayload = await createBackupPayload();
  const allData = await loadAllData();
  const safeSettings = (allData.settings || []).filter((item) => item.id !== CONFIG_ID);
  backupPayload.data.settings = safeSettings;

  const encryptedPayload = await encryptJson(backupPayload, password);
  const body = {
    message: `Sync Meu Controle Financeiro ${new Date().toISOString()}`,
    content: encodeContent(JSON.stringify(encryptedPayload, null, 2)),
    branch: normalized.branch,
  };

  if (remote.exists) {
    body.sha = remote.sha;
  }

  const path = normalized.path.split('/').map(encodeURIComponent).join('/');
  const result = await githubRequest(`${API_BASE}/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(normalized.repo)}/contents/${path}`, normalized.token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  const savedConfig = await saveGithubSyncConfig({
    ...normalized,
    lastSha: result.content?.sha || remote.sha,
    lastSyncedAt: new Date().toISOString(),
    lastRemoteUpdatedAt: result.commit?.committer?.date || null,
  });

  return { config: savedConfig, result };
}
