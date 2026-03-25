'use client';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';

export default function OutfitGaleriePage() {
  return <ProtectedRoute><OutfitGalerie /></ProtectedRoute>;
}

function OutfitGalerie() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { confirm: confirmDialog, dialog: confirmDialogEl } = useConfirm();

  useEffect(() => {
    api.umstyling.gallery()
      .then(d => setImages(d.images || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteImage = async (id: string) => {
    if (!await confirmDialog('Dieses Bild wirklich löschen?')) return;
    try {
      await api.umstyling.deleteGalleryImage(id);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch {}
  };

  const deleteAll = async () => {
    if (!await confirmDialog(`Alle ${images.length} Bilder wirklich löschen?`)) return;
    try {
      await api.umstyling.deleteAllGallery();
      setImages([]);
    } catch {}
  };

  if (loading) return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-4">Outfit-Galerie</h1>
      <p className="text-charcoal-light animate-pulse">Bilder werden geladen...</p>
    </main>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-3xl text-charcoal">👗 Meine Outfit-Galerie</h1>
        {images.length > 0 && (
          <button onClick={deleteAll} className="text-xs text-red-400 hover:text-red-600 transition-colors">
            🗑 Alle löschen
          </button>
        )}
      </div>
      <p className="text-sm text-charcoal-light mb-6">
        Alle Bilder aus deinen Stilberatungen — dein persönliches Style-Board. Bilder bleiben auch wenn du Chats löschst.
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
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <button onClick={() => setExpanded(img.imageUrl)} className="block w-full">
                <img
                  src={img.imageUrl}
                  alt={img.description || 'Outfit'}
                  className="w-full aspect-square object-cover rounded-2xl hover:opacity-90 transition-opacity"
                />
              </button>
              {img.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs line-clamp-2">{img.description}</p>
                </div>
              )}
              <button
                onClick={() => deleteImage(img.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Bild löschen"
              >
                ×
              </button>
              <p className="text-[10px] text-charcoal-light mt-1 text-center">
                {new Date(img.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
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
      {confirmDialogEl}
    </main>
  );
}
