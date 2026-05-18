import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { DEFAULT_NOTIFICATION_SETTINGS, getById, upsert } from '../db/indexedDb.js';
import { addMonths, currentMonthKey, daysBetween, formatDate, pad, todayISO } from '../utils/dateUtils.js';
import { BILL_STATUS, getBillEffectiveStatus } from './billService.js';
import { INVOICE_STATUS } from './cardService.js';
import { getInvoiceMeta } from './invoiceService.js';

const CHANNEL_ID = 'finance-reminders';
const APP_NOTIFICATION_FLAG = 'meu-controle-financeiro';

function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function normalizeNotificationSettings(settings = {}) {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...settings,
    id: 'default',
    enabled: Boolean(settings.enabled),
    billsBeforeDue: settings.billsBeforeDue !== false,
    overdueBills: settings.overdueBills !== false,
    invoicesBeforeDue: settings.invoicesBeforeDue !== false,
    overdueInvoices: settings.overdueInvoices !== false,
    backupReminder: settings.backupReminder !== false,
    daysBeforeDue: Math.max(1, Number(settings.daysBeforeDue || DEFAULT_NOTIFICATION_SETTINGS.daysBeforeDue)),
    notificationTime: settings.notificationTime || DEFAULT_NOTIFICATION_SETTINGS.notificationTime,
    lastScheduledIds: Array.isArray(settings.lastScheduledIds) ? settings.lastScheduledIds : [],
  };
}

export function getNotificationSupport() {
  const native = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const notification = typeof window !== 'undefined' && 'Notification' in window;
  const serviceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const secure = typeof window !== 'undefined' && window.isSecureContext;
  const android = native && platform === 'android';

  return {
    supported: android || (notification && serviceWorker && secure),
    automatic: android,
    native,
    platform,
    notification,
    serviceWorker,
    secure,
    permission: android ? 'android' : notification ? Notification.permission : 'unsupported',
  };
}

export async function getNotificationRuntimeStatus() {
  const support = getNotificationSupport();
  if (!isAndroidApp()) return support;

  const permission = await LocalNotifications.checkPermissions().catch(() => ({ display: 'unknown' }));
  const enabled = await LocalNotifications.areEnabled().catch(() => ({ value: null }));
  const exact = await LocalNotifications.checkExactNotificationSetting().catch(() => ({ exact_alarm: 'unknown' }));

  return {
    ...support,
    permission: permission.display,
    androidSystemEnabled: enabled.value,
    exactAlarmPermission: exact.exact_alarm,
  };
}

async function ensureAndroidChannel() {
  if (!isAndroidApp()) return;

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Avisos financeiros',
    description: 'Contas, faturas e lembretes do Meu Controle Financeiro',
    importance: 4,
    visibility: 1,
    lights: true,
    lightColor: '#047857',
    vibration: true,
  }).catch(() => {});
}

async function saveRuntimeStatus(extra = {}) {
  const existing = await getById('notification_settings', 'default');
  const runtime = await getNotificationRuntimeStatus();
  return saveNotificationSettings({
    ...(existing || {}),
    ...extra,
    androidPermission: runtime.permission,
    androidSystemEnabled: runtime.androidSystemEnabled ?? null,
    exactAlarmPermission: runtime.exactAlarmPermission || 'unknown',
  });
}

export async function requestNotificationPermission() {
  if (isAndroidApp()) {
    const current = await LocalNotifications.checkPermissions().catch(() => ({ display: 'prompt' }));
    const permission = current.display === 'granted'
      ? current
      : await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' }));

    await ensureAndroidChannel();
    await saveRuntimeStatus({ androidPermission: permission.display });

    return {
      granted: permission.display === 'granted',
      message:
        permission.display === 'granted'
          ? 'Notificações automáticas ativadas neste Android.'
          : 'Permissão de notificação não concedida no Android.',
    };
  }

  const support = getNotificationSupport();
  if (!support.supported) {
    return {
      granted: false,
      message: 'Este navegador ou endereço não permite notificações PWA locais agora.',
    };
  }

  const permission = await Notification.requestPermission();
  return {
    granted: permission === 'granted',
    message:
      permission === 'granted'
        ? 'Notificações ativadas neste navegador.'
        : 'Permissão de notificação não concedida.',
  };
}

export async function saveNotificationSettings(settings) {
  const existing = await getById('notification_settings', 'default');
  return upsert('notification_settings', normalizeNotificationSettings({
    ...(existing || {}),
    ...settings,
  }));
}

function hashNotificationId(value) {
  const text = String(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return 100000 + Math.abs(hash % 1900000000);
}

function toLocalISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDaysISO(dateISO, amount) {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toLocalISODate(date);
}

function dateAtReminderTime(dateISO, time = '09:00') {
  const [hour, minute] = String(time || '09:00').split(':').map((part) => Number(part));
  return new Date(`${dateISO}T${pad(Number.isFinite(hour) ? hour : 9)}:${pad(Number.isFinite(minute) ? minute : 0)}:00`);
}

function nextDailyReminder(time) {
  const now = new Date();
  const todayAtTime = dateAtReminderTime(todayISO(), time);
  if (todayAtTime > now) return todayAtTime;
  return dateAtReminderTime(addDaysISO(todayISO(), 1), time);
}

function futureReminder(dateISO, time) {
  const date = dateAtReminderTime(dateISO, time);
  return date > new Date() ? date : null;
}

function overdueReminder(dueDate, time) {
  const firstOverdueReminder = dateAtReminderTime(addDaysISO(dueDate, 1), time);
  return firstOverdueReminder > new Date() ? firstOverdueReminder : nextDailyReminder(time);
}

function notificationPayload({ id, title, body, at, kind, sourceId }) {
  return {
    id,
    title,
    body,
    schedule: { at, allowWhileIdle: true },
    channelId: CHANNEL_ID,
    group: 'finance-reminders',
    autoCancel: true,
    extra: {
      app: APP_NOTIFICATION_FLAG,
      kind,
      sourceId,
    },
  };
}

function buildBillNotifications(data, settings) {
  const today = todayISO();
  const notifications = [];

  (data.monthly_bills || []).forEach((bill) => {
    if (!bill.dueDate || bill.status === BILL_STATUS.PAID) return;

    const status = getBillEffectiveStatus(bill, today);
    const billDaysBefore = Number(bill.notifyDaysBefore || settings.daysBeforeDue);

    if (settings.overdueBills && status === BILL_STATUS.OVERDUE) {
      notifications.push(notificationPayload({
        id: hashNotificationId(`bill-overdue-${bill.id}`),
        title: 'Conta vencida',
        body: `${bill.name} venceu em ${formatDate(bill.dueDate)}.`,
        at: overdueReminder(bill.dueDate, settings.notificationTime),
        kind: 'bill-overdue',
        sourceId: bill.id,
      }));
      return;
    }

    const wantsBeforeDue = bill.notifyBefore !== false;
    const reminderDate = addDaysISO(bill.dueDate, -billDaysBefore);
    const diff = daysBetween(today, bill.dueDate);
    let scheduleAt = null;

    if (settings.billsBeforeDue && wantsBeforeDue && diff >= 0) {
      scheduleAt = futureReminder(reminderDate, settings.notificationTime);
      if (!scheduleAt && diff <= billDaysBefore) {
        scheduleAt = nextDailyReminder(settings.notificationTime);
      }
    }

    if (scheduleAt) {
      notifications.push(notificationPayload({
        id: hashNotificationId(`bill-before-${bill.id}`),
        title: 'Conta próxima do vencimento',
        body: `${bill.name} vence em ${formatDate(bill.dueDate)}.`,
        at: scheduleAt,
        kind: 'bill-before',
        sourceId: bill.id,
      }));
    }
  });

  return notifications;
}

function invoiceMonths(data) {
  const months = new Set([currentMonthKey(), addMonths(currentMonthKey(), 1)]);
  (data.card_transactions || []).forEach((transaction) => {
    if (transaction.invoiceMonth) months.add(transaction.invoiceMonth);
  });
  (data.card_invoices || []).forEach((invoice) => {
    if (invoice.month) months.add(invoice.month);
  });
  return [...months];
}

function buildInvoiceNotifications(data, settings) {
  const today = todayISO();
  const notifications = [];
  const months = invoiceMonths(data);

  (data.cards || [])
    .filter((card) => card.active !== false)
    .forEach((card) => {
      months.forEach((month) => {
        const invoice = getInvoiceMeta(card, month, data.card_invoices || [], data.card_transactions || [], today);
        if (!invoice.dueDate || invoice.total <= 0 || invoice.status === INVOICE_STATUS.PAID) return;

        if (settings.overdueInvoices && invoice.status === INVOICE_STATUS.OVERDUE) {
          notifications.push(notificationPayload({
            id: hashNotificationId(`invoice-overdue-${invoice.id}`),
            title: 'Fatura vencida',
            body: `A fatura de ${card.name} venceu em ${formatDate(invoice.dueDate)}.`,
            at: overdueReminder(invoice.dueDate, settings.notificationTime),
            kind: 'invoice-overdue',
            sourceId: invoice.id,
          }));
          return;
        }

        const reminderDate = addDaysISO(invoice.dueDate, -settings.daysBeforeDue);
        const diff = daysBetween(today, invoice.dueDate);
        let scheduleAt = null;

        if (settings.invoicesBeforeDue && diff >= 0) {
          scheduleAt = futureReminder(reminderDate, settings.notificationTime);
          if (!scheduleAt && diff <= settings.daysBeforeDue) {
            scheduleAt = nextDailyReminder(settings.notificationTime);
          }
        }

        if (scheduleAt) {
          notifications.push(notificationPayload({
            id: hashNotificationId(`invoice-before-${invoice.id}`),
            title: 'Fatura próxima do vencimento',
            body: `${card.name} vence em ${formatDate(invoice.dueDate)}.`,
            at: scheduleAt,
            kind: 'invoice-before',
            sourceId: invoice.id,
          }));
        }
      });
    });

  return notifications;
}

function buildBackupNotification(data, settings) {
  if (!settings.backupReminder) return [];

  const appSettings = (data.settings || []).find((item) => item.id === 'app') || {};
  const reminderDays = Number(appSettings.backupReminderDays || 15);
  const dueDate = settings.lastBackupAt ? addDaysISO(settings.lastBackupAt.slice(0, 10), reminderDays) : todayISO();
  const at = futureReminder(dueDate, settings.notificationTime) || nextDailyReminder(settings.notificationTime);

  return [
    notificationPayload({
      id: hashNotificationId('backup-reminder-default'),
      title: 'Lembrete de backup',
      body: 'Exporte ou envie seus dados para o cofre do GitHub para não perder suas informações.',
      at,
      kind: 'backup-reminder',
      sourceId: 'backup',
    }),
  ];
}

function buildAutomaticNotifications(data, settings) {
  return [
    ...buildBillNotifications(data, settings),
    ...buildInvoiceNotifications(data, settings),
    ...buildBackupNotification(data, settings),
  ]
    .filter((notification) => notification.schedule?.at instanceof Date)
    .sort((a, b) => a.schedule.at - b.schedule.at)
    .slice(0, 60);
}

async function cancelScheduledIds(ids = []) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Boolean))];
  if (!uniqueIds.length) return;

  await LocalNotifications.cancel({
    notifications: uniqueIds.map((id) => ({ id })),
  }).catch(() => {});
}

async function scheduleWithFallback(notifications) {
  try {
    await LocalNotifications.schedule({ notifications });
    return;
  } catch (error) {
    const withoutExactAlarm = notifications.map((notification) => ({
      ...notification,
      schedule: {
        ...notification.schedule,
        allowWhileIdle: false,
      },
    }));
    await LocalNotifications.schedule({ notifications: withoutExactAlarm });
  }
}

export async function scheduleAutomaticNotifications(data) {
  if (!isAndroidApp()) {
    return { scheduled: 0, message: 'Agendamento automático só roda dentro do app Android.' };
  }

  const currentSettings = normalizeNotificationSettings(data.notification_settings?.[0]);

  if (!currentSettings.enabled) {
    await cancelScheduledIds(currentSettings.lastScheduledIds);
    await saveNotificationSettings({ ...currentSettings, lastScheduledIds: [], lastAutomaticScheduleAt: new Date().toISOString() });
    return { scheduled: 0, message: 'Notificações automáticas desativadas.' };
  }

  const permission = await LocalNotifications.checkPermissions().catch(() => ({ display: 'denied' }));
  if (permission.display !== 'granted') {
    await saveRuntimeStatus({ lastAutomaticScheduleAt: new Date().toISOString() });
    return { scheduled: 0, message: 'Permissão de notificação não concedida.' };
  }

  await ensureAndroidChannel();
  const notifications = buildAutomaticNotifications(data, currentSettings);

  await cancelScheduledIds(currentSettings.lastScheduledIds);
  if (notifications.length) {
    await scheduleWithFallback(notifications);
  }

  await saveRuntimeStatus({
    lastScheduledIds: notifications.map((notification) => notification.id),
    lastAutomaticScheduleAt: new Date().toISOString(),
  });

  return {
    scheduled: notifications.length,
    message: notifications.length
      ? `${notifications.length} notificação(ões) agendada(s) no Android.`
      : 'Nenhum aviso futuro para agendar agora.',
  };
}

export async function sendTestNotification() {
  if (isAndroidApp()) {
    const permission = await requestNotificationPermission();
    if (!permission.granted) return permission;

    await ensureAndroidChannel();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: hashNotificationId(`test-${Date.now()}`),
          title: 'Teste de notificação',
          body: 'Se você recebeu este aviso, o Android está permitindo notificações do app.',
          channelId: CHANNEL_ID,
          autoCancel: true,
          extra: { app: APP_NOTIFICATION_FLAG, kind: 'test' },
        },
      ],
    });

    return { granted: true, message: 'Notificação de teste enviada.' };
  }

  const permission = await requestNotificationPermission();
  if (!permission.granted) return permission;

  const support = getNotificationSupport();
  if (!support.supported) {
    return { granted: false, message: 'Este navegador não permite enviar uma notificação de teste agora.' };
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('Teste de notificação', {
    body: 'Se você recebeu este aviso, o navegador permitiu notificações do app.',
    icon: new URL('icon.svg', window.location.href).toString(),
    badge: new URL('icons/icon-192.png', window.location.href).toString(),
    tag: 'finance-test',
  });

  return { granted: true, message: 'Notificação de teste enviada.' };
}

export async function notifyImportantAlerts(alerts = []) {
  const important = alerts.filter((alert) => ['danger', 'warning'].includes(alert.type)).slice(0, 3);

  if (isAndroidApp()) {
    const permission = await requestNotificationPermission();
    if (!permission.granted) return permission;

    await ensureAndroidChannel();
    for (const [index, alert] of important.entries()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: hashNotificationId(`manual-${Date.now()}-${index}`),
            title: alert.title,
            body: alert.message,
            channelId: CHANNEL_ID,
            autoCancel: true,
            extra: { app: APP_NOTIFICATION_FLAG, kind: 'manual' },
          },
        ],
      });
    }

    return {
      sent: important.length,
      message: important.length ? 'Notificações enviadas no Android.' : 'Nenhum aviso urgente para notificar agora.',
    };
  }

  const support = getNotificationSupport();
  if (!support.supported || support.permission !== 'granted') {
    return { sent: 0, message: 'Notificações do sistema indisponíveis; os avisos internos continuam funcionando.' };
  }

  const registration = await navigator.serviceWorker.ready;

  for (const alert of important) {
    await registration.showNotification(alert.title, {
      body: alert.message,
      icon: new URL('icon.svg', window.location.href).toString(),
      badge: new URL('icons/icon-192.png', window.location.href).toString(),
      tag: `finance-${alert.title}`,
    });
  }

  const existing = await getById('notification_settings', 'default');
  await upsert('notification_settings', {
    ...(existing || {}),
    id: 'default',
    lastNotificationCheckAt: new Date().toISOString(),
  });

  return {
    sent: important.length,
    message: important.length ? 'Notificações enviadas.' : 'Nenhum aviso urgente para notificar agora.',
  };
}
