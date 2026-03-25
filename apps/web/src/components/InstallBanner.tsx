'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed === 'true') return;

    const loginCount = parseInt(localStorage.getItem('pwa-login-count') || '0', 10) + 1;
    localStorage.setItem('pwa-login-count', String(loginCount));

    if (loginCount > 3) {
      localStorage.setItem('pwa-install-dismissed', 'true');
      return;
    }

    setShow(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show || !prompt) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-install-dismissed', 'true');
      setShow(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShow(false);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 bg-white rounded-2xl shadow-xl border border-cream-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-regency-light flex items-center justify-center text-xl shrink-0">🌿</div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-charcoal-800">SpicyHealth installieren</p>
        <p className="text-xs text-charcoal-400">Zum Startbildschirm hinzufügen für schnellen Zugriff</p>
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5">Installieren</button>
        <button onClick={handleDismiss} className="btn-ghost text-xs px-3 py-1.5">Nicht jetzt</button>
      </div>
    </div>
  );
}
