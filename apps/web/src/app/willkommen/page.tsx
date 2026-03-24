'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const DIETARY_OPTIONS = [
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'vegetarian', label: 'Vegetarisch', emoji: '🥬' },
  { id: 'gluten-free', label: 'Glutenfrei', emoji: '🌾' },
  { id: 'dairy-free', label: 'Laktosefrei', emoji: '🥛' },
  { id: 'low-carb', label: 'Low Carb', emoji: '🥑' },
  { id: 'high-protein', label: 'Proteinreich', emoji: '💪' },
];

const GOALS = [
  { id: 'healthy', label: 'Gesünder essen', emoji: '🥗' },
  { id: 'plan', label: 'Mahlzeiten planen', emoji: '📅' },
  { id: 'style', label: 'Meinen Stil finden', emoji: '👗' },
  { id: 'weight', label: 'Gewicht managen', emoji: '⚖️' },
  { id: 'budget', label: 'Günstiger einkaufen', emoji: '💰' },
  { id: 'inspire', label: 'Neue Rezepte entdecken', emoji: '✨' },
];

export default function WillkommenPage() {
  return <ProtectedRoute><Onboarding /></ProtectedRoute>;
}

function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const data: Record<string, any> = { dietaryPreferences: dietary };
      if (name.trim()) data.displayName = name.trim();
      await api.users.update(data);
      router.push('/mein-tag');
    } catch {
      router.push('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-regency' : 'bg-cream-dark'}`} />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-6xl mb-6">✨</div>
            <h1 className="font-heading text-3xl text-charcoal mb-3">Willkommen bei SpicyHealth!</h1>
            <p className="text-charcoal-light mb-8 leading-relaxed">
              Schön, dass du da bist! In wenigen Schritten richten wir alles für dich ein —
              damit du dich rundum wohlfühlst.
            </p>
            <Button onClick={() => setStep(2)} size="lg" className="w-full">Los geht's! →</Button>
          </div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="font-heading text-2xl text-charcoal">Wie heisst du?</h2>
              <p className="text-sm text-charcoal-light mt-1">Damit wir dich persönlich ansprechen können</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field text-center text-lg mb-6"
              placeholder="Dein Vorname"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>←</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Weiter →</Button>
            </div>
          </Card>
        )}

        {/* Step 3: Dietary preferences */}
        {step === 3 && (
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🥗</div>
              <h2 className="font-heading text-2xl text-charcoal">Wie ernährst du dich?</h2>
              <p className="text-sm text-charcoal-light mt-1">Wähle alles was auf dich zutrifft (optional)</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleItem(dietary, opt.id, setDietary)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2 ${
                    dietary.includes(opt.id)
                      ? 'bg-regency-light ring-2 ring-regency text-charcoal'
                      : 'bg-cream hover:bg-cream-dark text-charcoal-light'
                  }`}
                >
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>←</Button>
              <Button onClick={() => setStep(4)} className="flex-1">Weiter →</Button>
            </div>
          </Card>
        )}

        {/* Step 4: Goals + Finish */}
        {step === 4 && (
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎯</div>
              <h2 className="font-heading text-2xl text-charcoal">Was möchtest du erreichen?</h2>
              <p className="text-sm text-charcoal-light mt-1">Wähle deine Ziele (optional)</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {GOALS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleItem(goals, opt.id, setGoals)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2 ${
                    goals.includes(opt.id)
                      ? 'bg-pistachio-light ring-2 ring-pistachio text-charcoal'
                      : 'bg-cream hover:bg-cream-dark text-charcoal-light'
                  }`}
                >
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
            <Button onClick={handleFinish} size="lg" className="w-full" disabled={saving}>
              {saving ? 'Wird eingerichtet...' : '🎉 Fertig — ab geht\'s!'}
            </Button>
            <button onClick={() => setStep(3)} className="w-full text-center text-sm text-charcoal-light mt-3 hover:text-charcoal">← Zurück</button>
          </Card>
        )}
      </div>
    </main>
  );
}
