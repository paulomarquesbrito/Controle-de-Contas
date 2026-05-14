import { useEffect, useState } from 'react';

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(Boolean(standalone));

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) {
      return {
        ok: false,
        message: 'Este navegador ainda não liberou o botão de instalação. Use o menu do navegador para adicionar à tela inicial.',
      };
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    return {
      ok: choice.outcome === 'accepted',
      message:
        choice.outcome === 'accepted'
          ? 'Instalação iniciada.'
          : 'Instalação cancelada.',
    };
  }

  return {
    canInstall: Boolean(deferredPrompt),
    installed,
    promptInstall,
    secureContext: window.isSecureContext,
  };
}
