'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'smoothie'];

export default function NewRecipePage() {
  return <ProtectedRoute><NewRecipeForm /></ProtectedRoute>;
}

function NewRecipeForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'lunch',
    prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2,
    estimatedCostEur: 5,
    ingredients: [{ name: '', quantity: 1, unit: 'g', calories: 0, estimatedCostEur: 0 }],
    instructions: [''],
    tags: '',
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  function addIngredient() {
    set('ingredients', [...form.ingredients, { name: '', quantity: 1, unit: 'g', calories: 0, estimatedCostEur: 0 }]);
  }
  function updateIngredient(i: number, key: string, value: any) {
    const ings = [...form.ingredients];
    ings[i] = { ...ings[i], [key]: value };
    set('ingredients', ings);
  }
  function addStep() { set('instructions', [...form.instructions, '']); }
  function updateStep(i: number, value: string) {
    const steps = [...form.instructions];
    steps[i] = value;
    set('instructions', steps);
  }

  const computedNutrition = {
    calories: form.ingredients.reduce((s, i) => s + (i.calories || 0), 0),
    proteinG: 0, carbsG: 0, fatG: 0,
  };
  const computedCost = form.ingredients.reduce((s, i) => s + (i.estimatedCostEur || 0), 0);

  async function handleSubmit() {
    setError(''); setLoading(true);
    try {
      const { recipe } = await api.recipes.create({
        ...form,
        ingredients: form.ingredients.filter(i => i.name.trim()),
        instructions: form.instructions.filter(s => s.trim()),
        estimatedCostEur: form.estimatedCostEur || computedCost,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      router.push(`/recipes/detail?id=${recipe.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-2">Neues Rezept</h1>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-terracotta' : 'bg-blush-light'}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Grundangaben</h2>
          <div className="flex flex-col gap-4">
            <Input label="Titel" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Avocado-Mango-Salat" required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-charcoal">Beschreibung</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="Ein frischer, lebendiger Salat…"
                className="input-field resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-charcoal">Kategorie</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Vorbereitung (min)" type="number" value={form.prepTimeMinutes} onChange={e => set('prepTimeMinutes', Number(e.target.value))} />
              <Input label="Kochzeit (min)" type="number" value={form.cookTimeMinutes} onChange={e => set('cookTimeMinutes', Number(e.target.value))} />
              <Input label="Portionen" type="number" value={form.servings} onChange={e => set('servings', Number(e.target.value))} />
            </div>
            <Input label="Geschätzte Kosten (CHF)" type="number" step="0.5" value={form.estimatedCostEur} onChange={e => set('estimatedCostEur', Number(e.target.value))} />
            <Input label="Tags (kommagetrennt)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="vegan, schnell, glutenfrei" />
            <Button onClick={() => setStep(2)} className="w-full">Weiter: Zutaten →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Zutaten</h2>
          <div className="flex flex-col gap-3">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end">
                <div className="col-span-2"><Input label={i === 0 ? 'Zutat' : ''} value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Avocado" /></div>
                <Input label={i === 0 ? 'Menge' : ''} type="number" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} />
                <Input label={i === 0 ? 'Einheit' : ''} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="g" />
              </div>
            ))}
            <button onClick={addIngredient} className="btn-ghost text-sm mt-1">+ Zutat hinzufügen</button>
          </div>
          {step === 2 && form.ingredients.length > 0 && (
            <div className="bg-cream-50 rounded-xl p-4 text-sm mt-4">
              <p className="font-semibold text-charcoal-700 mb-1">Geschätzte Gesamtwerte</p>
              <div className="flex gap-6 text-charcoal-500">
                <span>🔥 {computedNutrition.calories} kcal</span>
                <span>💰 CHF {computedCost.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setStep(1)}>← Zurück</Button>
            <Button onClick={() => setStep(3)} className="flex-1">Weiter: Zubereitung →</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Zubereitung</h2>
          <div className="flex flex-col gap-3">
            {form.instructions.map((step_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-terracotta text-white text-xs font-bold rounded-full flex items-center justify-center mt-2.5">{i + 1}</span>
                <textarea value={step_} onChange={e => updateStep(i, e.target.value)}
                  rows={2} placeholder={`Schritt ${i + 1}…`}
                  className="input-field flex-1 resize-none text-sm" />
              </div>
            ))}
            <button onClick={addStep} className="btn-ghost text-sm mt-1">+ Schritt hinzufügen</button>
          </div>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>← Zurück</Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? 'Speichern…' : '🎉 Rezept veröffentlichen'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
