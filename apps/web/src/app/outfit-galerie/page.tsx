'use client';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

export default function OutfitGaleriePage() {
  return <ProtectedRoute><OutfitGalerie /></ProtectedRoute>;
}

function OutfitGalerie() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [images, setImages] = useState<{ url: string; text: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // Load all style conversations and extract images
    api.umstyling.listConversations().then(async (res) => {
      const allImages: { url: string; text: string; date: string }[] = [];
      // Load each conversation to get images
      for (const conv of res.conversations.slice(0, 20)) {
        try {
          const { conversation } = await api.umstyling.getConversation(conv.id);
          for (const msg of conversation.messages) {
            if (msg.imageUrls?.length) {
              for (const url of msg.imageUrls) {
                allImages.push({
                  url,
                  text: msg.content?.substring(0, 100) || '',
                  date: msg.timestamp,
                });
              }
            }
          }
        } catch {}
      }
      setImages(allImages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-4">Outfit-Galerie</h1>
      <p className="text-charcoal-light animate-pulse">Bilder werden geladen...</p>
    </main>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-2">👗 Meine Outfit-Galerie</h1>
      <p className="text-sm text-charcoal-light mb-6">
        Alle Bilder aus deinen Stilberatungen — dein persönliches Style-Board.
      </p>

      {images.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-3">👗</p>
          <p className="text-charcoal font-medium mb-1">Noch keine Outfits</p>
          <p className="text-sm text-charcoal-light">
            Nutze die Stilberatung und lass dir Outfits vorschlagen — sie erscheinen dann hier.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={i} className="group relative">
              <button onClick={() => setExpanded(img.url)} className="block w-full">
                <img
                  src={img.url}
                  alt={img.text || 'Outfit'}
                  className="w-full aspect-square object-cover rounded-2xl hover:opacity-90 transition-opacity"
                />
              </button>
              {img.text && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs line-clamp-2">{img.text}</p>
                </div>
              )}
              <p className="text-[10px] text-charcoal-light mt-1 text-center">
                {new Date(img.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setExpanded(null)}>
          <img src={expanded} alt="Outfit" className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setExpanded(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30">
            ×
          </button>
        </div>
      )}
    </main>
  );
}
