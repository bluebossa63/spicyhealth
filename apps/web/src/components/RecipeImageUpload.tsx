'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface RecipeImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export function RecipeImageUpload({ imageUrl, onImageChange }: RecipeImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadUrl, publicUrl } = await api.recipes.requestUploadUrl(file.name, file.type);
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file,
      });
      onImageChange(publicUrl);
    } catch {
      alert('Bild-Upload fehlgeschlagen. Bitte versuche es nochmal.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (url) {
      onImageChange(url);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-charcoal">Rezeptbild</label>

      {imageUrl ? (
        <div className="relative">
          <img src={imageUrl} alt="Rezeptbild" className="w-full h-48 object-cover rounded-xl border border-cream-dark" />
          <button
            onClick={() => onImageChange('')}
            className="absolute top-2 right-2 w-7 h-7 bg-charcoal/70 text-white rounded-full text-sm flex items-center justify-center hover:bg-charcoal/90"
            title="Bild entfernen"
          >
            x
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-regency-light rounded-xl p-6 text-center">
          <p className="text-sm text-charcoal-light mb-3">Noch kein Bild</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary text-sm px-4 py-2"
            >
              {uploading ? 'Wird hochgeladen...' : 'Foto hochladen'}
            </button>
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="btn-ghost text-sm px-4 py-2"
            >
              Bild-URL einfügen
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://... (Bild-URL einfügen)"
            className="input-field flex-1 text-sm"
          />
          <button onClick={handleUrlSubmit} className="btn-secondary text-sm px-3">OK</button>
        </div>
      )}

      {imageUrl && (
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-ghost text-xs"
          >
            {uploading ? 'Wird hochgeladen...' : 'Anderes Foto'}
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="btn-ghost text-xs"
          >
            URL ändern
          </button>
        </div>
      )}
    </div>
  );
}
