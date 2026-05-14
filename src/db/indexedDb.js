import { DEFAULT_CATEGORIES } from '../data/defaultCategories.js';
import { createId } from '../utils/idUtils.js';

export const DB_NAME = 'meu-controle-financeiro-db';
export const DB_VERSION = 1;

export const STORE_NAMES = [
  'settings',
  'categories',
  'recurring_bills',
  'monthly_bills',
  'cards',
  'card_transactions',
  'card_invoices',
  'savings',
  'learned_category_rules',
  'notification_settings',
  'import_logs',
];

let dbPromise;

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não oferece suporte a IndexedDB.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function getAll(storeName) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  const records = await requestToPromise(transaction.objectStore(storeName).getAll());
  await txDone(transaction);
  return records;
}

export async function getById(storeName, id) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readonly');
  const record = await requestToPromise(transaction.objectStore(storeName).get(id));
  await txDone(transaction);
  return record;
}

export async function upsert(storeName, record) {
  const db = await openDatabase();
  const now = new Date().toISOString();
  const item = {
    ...record,
    id: record.id || createId(storeName.replace(/s$/, '')),
    createdAt: record.createdAt || now,
    updatedAt: now,
  };

  const transaction = db.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).put(item));
  await txDone(transaction);
  return item;
}

export async function bulkPut(storeName, records) {
  const db = await openDatabase();
  const now = new Date().toISOString();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  records.forEach((record) => {
    const item = {
      ...record,
      id: record.id || createId(storeName.replace(/s$/, '')),
      createdAt: record.createdAt || now,
      updatedAt: record.updatedAt || now,
    };
    store.put(item);
  });

  await txDone(transaction);
}

export async function remove(storeName, id) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).delete(id));
  await txDone(transaction);
}

export async function clearStore(storeName) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  await requestToPromise(transaction.objectStore(storeName).clear());
  await txDone(transaction);
}

export async function loadAllData() {
  const entries = await Promise.all(STORE_NAMES.map(async (storeName) => [storeName, await getAll(storeName)]));
  return Object.fromEntries(entries);
}

export async function clearAllData() {
  for (const storeName of STORE_NAMES) {
    await clearStore(storeName);
  }
}

export async function replaceAllData(data) {
  await clearAllData();

  for (const storeName of STORE_NAMES) {
    const records = Array.isArray(data[storeName]) ? data[storeName] : [];
    await bulkPut(storeName, records);
  }

  await ensureInitialData();
}

export async function ensureInitialData() {
  const categories = await getAll('categories');
  if (!categories.length) {
    await bulkPut('categories', DEFAULT_CATEGORIES.map((category, index) => ({ ...category, order: index })));
  }

  const settings = await getById('settings', 'app');
  if (!settings) {
    await upsert('settings', {
      id: 'app',
      appName: 'Meu Controle Financeiro',
      firstRunAt: new Date().toISOString(),
      backupReminderDays: 15,
    });
  }

  const notificationSettings = await getById('notification_settings', 'default');
  if (!notificationSettings) {
    await upsert('notification_settings', {
      id: 'default',
      enabled: false,
      billsBeforeDue: true,
      overdueBills: true,
      invoicesBeforeDue: true,
      backupReminder: true,
      daysBeforeDue: 3,
      lastBackupAt: null,
      lastNotificationCheckAt: null,
    });
  }
}
