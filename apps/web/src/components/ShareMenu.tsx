'use client';
import { useState } from 'react';

interface ShareMenuProps {
  text: string;
  title?: string;
}

export function ShareMenu({ text, title }: ShareMenuProps) {
  const [open, setOpen] = useState(false);

  const encoded = encodeURIComponent(text);

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setOpen(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: title || 'SpicyHealth', text });
    }
    setOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    alert('Kopiert! Du kannst es jetzt einfügen.');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost text-sm flex items-center gap-1.5">
        📤 Teilen
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-cream-dark py-1 min-w-[200px]">
            <button onClick={shareWhatsApp} className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream-dark transition-colors flex items-center gap-3">
              <span className="text-lg">💬</span> WhatsApp
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button onClick={shareNative} className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream-dark transition-colors flex items-center gap-3">
                <span className="text-lg">📱</span> Weitere Apps...
              </button>
            )}
            <button onClick={copyToClipboard} className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream-dark transition-colors flex items-center gap-3">
              <span className="text-lg">📋</span> Text kopieren
            </button>
          </div>
        </>
      )}
    </div>
  );
}
