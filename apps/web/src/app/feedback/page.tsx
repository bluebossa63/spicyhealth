'use client';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: 'feature', label: 'Feature-Wunsch', emoji: '💡' },
  { id: 'bug', label: 'Fehler melden', emoji: '🐛' },
  { id: 'design', label: 'Design & Usability', emoji: '🎨' },
  { id: 'recipe', label: 'Rezepte & Ernährung', emoji: '🥗' },
  { id: 'styling', label: 'Stilberatung', emoji: '👗' },
  { id: 'general', label: 'Allgemeines', emoji: '💬' },
];

const RATINGS = [
  { value: 5, emoji: '😍', label: 'Liebe es!' },
  { value: 4, emoji: '😊', label: 'Sehr gut' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 2, emoji: '😕', label: 'Könnte besser sein' },
  { value: 1, emoji: '😞', label: 'Nicht gut' },
];

export default function FeedbackPage() {
  return <ProtectedRoute><FeedbackForm /></ProtectedRoute>;
}

function FeedbackForm() {
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      // Save feedback as a daily log note (reusing existing API)
      await api.dailyLogs.update({
        date: new Date().toISOString().slice(0, 10),
        note: `[FEEDBACK|${category}|${rating}] ${message}`,
      });
      setSubmitted(true);
    } catch {
      alert('Feedback konnte nicht gesendet werden. Bitte versuche es nochmal.');
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">💝</div>
        <h1 className="font-heading text-3xl text-charcoal mb-3">Vielen Dank!</h1>
        <p className="text-charcoal-light mb-6">
          Dein Feedback hilft uns, SpicyHealth noch besser zu machen.
          Wir schätzen deine Meinung sehr!
        </p>
        <Button onClick={() => { setSubmitted(false); setMessage(''); setRating(0); }}>
          Weiteres Feedback geben
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-2">💬 Dein Feedback</h1>
      <p className="text-sm text-charcoal-light mb-6">
        Wir sind in der Beta-Phase und deine Meinung ist uns sehr wichtig!
        Erzähl uns, was du denkst.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <Card className="p-5">
          <h2 className="font-medium text-charcoal mb-3">Wie gefällt dir SpicyHealth?</h2>
          <div className="flex justify-between">
            {RATINGS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRating(r.value)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                  rating === r.value ? 'bg-regency-light scale-110 ring-2 ring-regency' : 'hover:bg-cream-dark'
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-[9px] text-charcoal-light">{r.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Category */}
        <Card className="p-5">
          <h2 className="font-medium text-charcoal mb-3">Worum geht es?</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`p-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                  category === c.id
                    ? 'bg-regency-light ring-2 ring-regency text-charcoal'
                    : 'bg-cream hover:bg-cream-dark text-charcoal-light'
                }`}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Message */}
        <Card className="p-5">
          <h2 className="font-medium text-charcoal mb-3">Deine Nachricht</h2>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="input-field resize-none text-sm"
            rows={4}
            placeholder="Was möchtest du uns mitteilen? Was gefällt dir? Was fehlt? Was können wir besser machen?"
            required
          />
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={sending || !message.trim()}>
          {sending ? 'Wird gesendet...' : '📤 Feedback senden'}
        </Button>
      </form>
    </main>
  );
}
