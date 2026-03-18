'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
    else setDismissed(true);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 bg-white rounded-2xl shadow-xl border border-cream-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center text-xl shrink-0">🌿</div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-charcoal-800">Install SpicyHealth</p>
        <p className="text-xs text-charcoal-400">Add to home screen for quick access</p>
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5">Install</button>
        <button onClick={() => setDismissed(true)} className="btn-ghost text-xs px-3 py-1.5">Later</button>
      </div>
    </div>
  );
}
