'use client';

import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { api } from '@/lib/api';

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<{ file: File; previewUrl: string; publicUrl?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const newImages = await Promise.all(
        files.slice(0, 3).map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          // Get SAS upload URL
          const { uploadUrl, publicUrl } = await api.umstyling.uploadImage(file.name, file.type);
          // Upload directly to Azure Blob
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
            body: file,
          });
          return { file, previewUrl, publicUrl };
        }),
      );
      setImages((prev) => [...prev, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Bild-Upload fehlgeschlagen. Bitte versuche es nochmal.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !images.length) return;
    if (disabled || uploading) return;

    const imageUrls = images.map((img) => img.publicUrl!).filter(Boolean);
    onSend(trimmed || 'Bitte analysiere dieses Bild.', imageUrls.length ? imageUrls : undefined);
    setText('');
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-cream-dark bg-cream p-3">
      {images.length > 0 && (
        <div className="flex gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.previewUrl} alt="" className="w-16 h-16 object-cover rounded-xl border border-blush" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-charcoal text-white rounded-full text-xs flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || images.length >= 3}
          className="flex-shrink-0 p-2.5 rounded-xl bg-blush-light hover:bg-blush transition-colors disabled:opacity-40"
          title="Bild hochladen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-charcoal-light">
            <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909a.75.75 0 01-1.06 0L6.97 7.53a.75.75 0 00-1.06 0l-3.41 3.53zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Schreib mir..."
          disabled={disabled}
          rows={1}
          className="input-field flex-1 resize-none min-h-[44px] max-h-32 py-2.5"
        />
        <button
          type="submit"
          disabled={disabled || uploading || (!text.trim() && !images.length)}
          className="flex-shrink-0 btn-primary px-4 py-2.5 rounded-xl disabled:opacity-40"
        >
          {uploading ? '...' : 'Senden'}
        </button>
      </div>
    </form>
  );
}
