export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', window.location.href);
    navigator.serviceWorker.register(serviceWorkerUrl, { scope: './' }).catch((error) => {
      console.info('Service Worker não registrado:', error);
    });
  });
}
