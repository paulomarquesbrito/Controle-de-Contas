import { getById, upsert } from '../db/indexedDb.js';

export function getNotificationSupport() {
  const notification = 'Notification' in window;
  const serviceWorker = 'serviceWorker' in navigator;
  const secure = window.isSecureContext;

  return {
    supported: notification && serviceWorker && secure,
    notification,
    serviceWorker,
    secure,
    permission: notification ? Notification.permission : 'unsupported',
  };
}

export async function requestNotificationPermission() {
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
  return upsert('notification_settings', {
    ...(existing || {}),
    id: 'default',
    ...settings,
  });
}

export async function notifyImportantAlerts(alerts = []) {
  const support = getNotificationSupport();
  if (!support.supported || support.permission !== 'granted') {
    return { sent: 0, message: 'Notificações do sistema indisponíveis; os avisos internos continuam funcionando.' };
  }

  const registration = await navigator.serviceWorker.ready;
  const important = alerts.filter((alert) => ['danger', 'warning'].includes(alert.type)).slice(0, 3);

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
