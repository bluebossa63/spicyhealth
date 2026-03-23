'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { api } from '@/lib/api';
import type { ChatMessage as ChatMessageType, Conversation } from '@spicyhealth/shared';

function StyleConsultant() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingLook, setGeneratingLook] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation list
  useEffect(() => {
    api.umstyling.listConversations().then((res) => setConversations(res.conversations)).catch(() => {});
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      const { conversation } = await api.umstyling.getConversation(id);
      setConversationId(conversation.id);
      setMessages(conversation.messages);
      setSidebarOpen(false);
    } catch {
      // ignore
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.umstyling.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSend = async (message: string, imageUrls?: string[]) => {
    // Optimistic: show user message immediately
    const userMsg: ChatMessageType = {
      role: 'user',
      content: message,
      imageUrls,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { conversation, reply } = await api.umstyling.chat({
        conversationId: conversationId || undefined,
        message,
        imageUrls,
      });
      setConversationId(conversation.id);
      // Replace with server state to stay in sync
      setMessages(conversation.messages);
    } catch {
      // Remove optimistic message on error, show error
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Entschuldigung, es gab ein Problem. Bitte versuch es nochmal.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLook = async (styleDescription: string) => {
    if (!conversationId || generatingLook) return;

    // Find latest user-uploaded image
    const latestUserImage = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && m.imageUrls?.length)
      ?.imageUrls?.[0];

    setGeneratingLook(true);
    try {
      if (latestUserImage) {
        const { conversation } = await api.umstyling.generateLook({
          conversationId,
          sourceImageUrl: latestUserImage,
          styleDescription,
        });
        setMessages(conversation.messages);
      } else {
        const { conversation } = await api.umstyling.generateSuggestion({
          conversationId,
          styleDescription,
        });
        setMessages(conversation.messages);
      }
    } catch {
      alert('Bild konnte nicht erstellt werden. Bitte versuche es nochmal.');
    } finally {
      setGeneratingLook(false);
    }
  };

  const handleTryOnGarment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || generatingLook) return;

    const latestUserImage = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && m.imageUrls?.length)
      ?.imageUrls?.[0];

    if (!latestUserImage) {
      alert('Bitte lade zuerst ein Foto von dir hoch, damit ich das Kleidungsstück anprobieren kann.');
      return;
    }

    setGeneratingLook(true);
    try {
      // Upload garment image
      const { uploadUrl, publicUrl } = await api.umstyling.uploadImage(file.name, file.type);
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file,
      });

      // Call virtual try-on
      const { conversation } = await api.umstyling.generateLook({
        conversationId,
        sourceImageUrl: latestUserImage,
        garmentImageUrl: publicUrl,
        styleDescription: 'Virtual Try-On',
      });
      setMessages(conversation.messages);
    } catch {
      alert('Anprobieren fehlgeschlagen. Bitte versuche es nochmal.');
    } finally {
      setGeneratingLook(false);
      if (garmentInputRef.current) garmentInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem-3.5rem)] md:h-[calc(100vh-4rem)] max-w-5xl mx-auto">
      {/* Sidebar — conversation history (desktop always, mobile toggle) */}
      <aside
        className={`${
          sidebarOpen ? 'fixed inset-0 z-40 bg-black/30' : 'hidden'
        } md:relative md:block md:bg-transparent md:z-auto`}
        onClick={() => setSidebarOpen(false)}
      >
        <div
          className={`${
            sidebarOpen ? 'w-72' : 'w-0 md:w-64'
          } md:w-64 h-full bg-cream border-r border-cream-dark flex flex-col overflow-hidden transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-cream-dark">
            <button onClick={startNewChat} className="btn-primary w-full text-sm py-2">
              + Neues Gespräch
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-1 p-2.5 rounded-xl mb-1 cursor-pointer transition-colors ${
                  conv.id === conversationId ? 'bg-regency-light' : 'hover:bg-cream-dark'
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <span className="text-xs text-charcoal truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 text-charcoal-light hover:text-red-500 text-xs px-1 transition-opacity"
                  title="Löschen"
                >
                  x
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-charcoal-light text-center mt-4">Noch keine Gespräche</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-dark bg-cream/50">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-regency-light transition-colors"
            onClick={() => setSidebarOpen(true)}
            title="Gespräche"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-charcoal-light">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center">
            <span className="text-sm">👗</span>
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-base font-semibold text-charcoal">Deine Stilberaterin</h1>
            <p className="text-[10px] text-charcoal-light">Persönliche Style-Beratung</p>
          </div>
          {conversationId && (
            <button
              onClick={() => garmentInputRef.current?.click()}
              disabled={generatingLook}
              className="px-3 py-1.5 rounded-full bg-regency-light hover:bg-regency text-charcoal text-xs font-medium transition-colors disabled:opacity-40"
              title="Lade ein Bild eines Kleidungsstücks hoch und probiere es virtuell an"
            >
              {generatingLook ? 'Wird erstellt...' : '👗 Anprobieren'}
            </button>
          )}
          <input
            ref={garmentInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleTryOnGarment}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mb-4">
                <span className="text-3xl">👗</span>
              </div>
              <h2 className="font-heading text-xl font-semibold text-charcoal mb-2">
                Willkommen bei deiner Stilberatung!
              </h2>
              <p className="text-sm text-charcoal-light mb-6 max-w-md">
                Ich bin deine persönliche Stilberaterin. Zusammen entdecken wir deinen individuellen Stil –
                warm, wertschätzend und ganz auf dich abgestimmt.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Was ist mein Stil-Typ?',
                  'Hilf mir bei meiner Capsule Wardrobe',
                  'Welche Farben stehen mir?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="px-4 py-2 rounded-full border border-regency-light text-sm text-charcoal hover:bg-regency-light transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <p className="text-xs text-charcoal-light mt-4">
                Du kannst auch ein Foto hochladen und ich analysiere deinen aktuellen Look.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onGenerateLook={handleGenerateLook}
              isGenerating={generatingLook}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center">
                <span className="text-sm">👗</span>
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-cream-dark">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-charcoal-light rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}

export default function UmstylingPage() {
  return (
    <ProtectedRoute>
      <StyleConsultant />
    </ProtectedRoute>
  );
}
