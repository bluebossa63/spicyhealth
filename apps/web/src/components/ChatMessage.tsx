'use client';

import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@spicyhealth/shared';

interface ChatMessageProps {
  message: ChatMessageType;
  onGenerateLook?: (description: string) => void;
  isGenerating?: boolean;
}

export function ChatMessage({ message, onGenerateLook, isGenerating }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Detect style suggestions in assistant messages for "Zeig mir den Look" button
  const hasStyleSuggestion = !isUser && message.content.length > 100 && !message.imageUrls?.length;

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-light flex items-center justify-center mr-2 mt-1">
            <span className="text-sm">👗</span>
          </div>
        )}
        <div className={`max-w-[80%] md:max-w-[70%]`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-terracotta-light text-charcoal rounded-br-md'
                : 'bg-white text-charcoal shadow-sm border border-cream-dark rounded-bl-md'
            }`}
          >
            {message.imageUrls?.map((url, i) => (
              <button
                key={i}
                onClick={() => setExpandedImage(url)}
                className="block w-full mb-2"
              >
                <img
                  src={url}
                  alt={`Bild ${i + 1}`}
                  className="rounded-xl max-h-64 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                />
              </button>
            ))}
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

            {/* "Zeig mir den Look" button for assistant suggestions */}
            {hasStyleSuggestion && onGenerateLook && (
              <button
                onClick={() => onGenerateLook(message.content.substring(0, 500))}
                disabled={isGenerating}
                className="mt-3 px-3 py-1.5 rounded-full bg-sage-light hover:bg-sage text-charcoal text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3 h-3 border-2 border-charcoal-light border-t-transparent rounded-full animate-spin" />
                    Bild wird erstellt...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M8 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM4.5 8a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm7 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM5.5 12.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
                    </svg>
                    Zeig mir den Look
                  </>
                )}
              </button>
            )}
          </div>
          <span className={`text-[10px] text-charcoal-light mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
            {time}
          </span>
        </div>
      </div>

      {/* Fullscreen image overlay */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Vergrössert"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl hover:bg-white/30 transition-colors"
          >
            x
          </button>
        </div>
      )}
    </>
  );
}
