'use client';

import type { ChatMessage as ChatMessageType } from '@spicyhealth/shared';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
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
            <img
              key={i}
              src={url}
              alt={`Bild ${i + 1}`}
              className="rounded-xl mb-2 max-h-48 object-cover w-full"
            />
          ))}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <span className={`text-[10px] text-charcoal-light mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
          {time}
        </span>
      </div>
    </div>
  );
}
