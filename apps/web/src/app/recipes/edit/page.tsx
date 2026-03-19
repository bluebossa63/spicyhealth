'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'smoothie'];
const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen',
  snack: 'Snack', dessert: 'Dessert', smoothie: 'Smoothie',
};

export default function EditRecipePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-charcoal-400">Laden…</div>}>
        <EditRecipeForm />
      </Suspense>
    </ProtectedRoute>
  );
}

function EditRecipeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: 'lunch',
    prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2,
    estimatedCostEur: 0,
    ingredients: [{ name: '', quantity: 1, unit: 'g', calories: 0, estimatedCostEur: 0 }],
    instructions: [''],
    tags: '',
  });

  useEffect(() => {
    if (!id) { router.push('/recipes'); return; }
    api.recipes.get(id).then(({ recipe }) => {
      setForm({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        estimatedCostEur: recipe.estimatedCostEur || 0,
        ingredients: recipe.ingredients?.length
          ? recipe.ingredients
          : [{ name: '', quantity: 1, unit: 'g', calories: 0, estimatedCostEur: 0 }],
        instructions: recipe.instructions?.length ? recipe.instructions : [''],
        tags: (recipe.tags || []).join(', '),
      });
    }).catch(() => router.push('/recipes'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  function addIngredient() {
    set('ingredients', [...form.ingredients, { name: '', quantity: 1, unit: 'g', calories: 0, estimatedCostEur: 0 }]);
  }
  function removeIngredient(i: number) {
    set('ingredients', form.ingredients.filter((_, idx) => idx !== i));
  }
  function updateIngredient(i: number, key: string, value: any) {
    const ings = [...form.ingredients];
    ings[i] = { ...ings[i], [key]: value };
    set('ingredients', ings);
  }
  function addStep() { set('instructions', [...form.instructions, '']); }
  function removeStep(i: number) { set('instructions', form.instructions.filter((_, idx) => idx !== i)); }
  function updateStep(i: number, value: string) {
    const steps = [...form.instructions];
    steps[i] = value;
    set('instructions', steps);
  }

  const computedCost = form.ingredients.reduce((s, i) => s + (i.estimatedCostEur || 0), 0);
  const computedCalories = form.ingredients.reduce((s, i) => s + (i.calories || 0), 0);

  async function handleSubmit() {
    setError(''); setSaving(true);
    try {
      await api.recipes.update(id!, {
        ...form,
        estimatedCostEur: form.estimatedCostEur || computedCost,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      });
      router.push(`/recipes/detail?id=${id}`);
    } catch (err: any) {
      setError(err.message || 'Speichern fehlgeschlagen');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-charcoal-400">Rezept wird geladen…</div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl text-charcoal-800 mb-2">Rezept bearbeiten</h1>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-terracotta-500' : 'bg-cream-200'}`} />
        ))}
      </div>

      {/* Step 1 — Basic info */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-xl text-charcoal-800">Grundangaben</h2>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Titel *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field" placeholder="Avocado-Mango-Salat" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Beschreibung *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input-field resize-none" placeholder="Ein frischer, lebendiger Salat…" />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Kategorie</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Vorbereitung (min)</label>
              <input type="number" min="0" value={form.prepTimeMinutes} onChange={e => set('prepTimeMinutes', Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Kochzeit (min)</label>
              <input type="number" min="0" value={form.cookTimeMinutes} onChange={e => set('cookTimeMinutes', Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Portionen</label>
              <input type="number" min="1" value={form.servings} onChange={e => set('servings', Number(e.target.value))} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Tags (kommagetrennt)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className="input-field" placeholder="vegan, schnell, glutenfrei" />
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full">Weiter: Zutaten →</button>
        </div>
      )}

      {/* Step 2 — Ingredients */}
      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-xl text-charcoal-800">Zutaten</h2>

          <div className="space-y-2">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} className="input-field text-sm" placeholder="Avocado" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} className="input-field text-sm" />
                </div>
                <div className="col-span-2">
                  <input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} className="input-field text-sm" placeholder="g" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" value={ing.calories} onChange={e => updateIngredient(i, 'calories', Number(e.target.value))} className="input-field text-sm" placeholder="kcal" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => removeIngredient(i)} className="text-charcoal-300 hover:text-red-400 text-lg leading-none" aria-label="Zutat entfernen">×</button>
                </div>
              </div>
            ))}
            {form.ingredients.length === 0 && (
              <p className="text-sm text-charcoal-400 italic text-center py-4">Keine Zutaten</p>
            )}
          </div>

          <button onClick={addIngredient} className="btn-ghost text-sm">+ Zutat hinzufügen</button>

          {form.ingredients.length > 0 && (
            <div className="bg-cream-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-charcoal-700 mb-1">Geschätzte Gesamtwerte</p>
              <div className="flex gap-6 text-charcoal-500">
                <span>🔥 {computedCalories} kcal</span>
                <span>💰 CHF {computedCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-ghost">← Zurück</button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1">Weiter: Zubereitung →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Instructions */}
      {step === 3 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-xl text-charcoal-800">Zubereitung</h2>

          <div className="space-y-3">
            {form.instructions.map((inst, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-terracotta-100 text-terracotta-700 text-sm font-bold flex items-center justify-center mt-1">
                  {i + 1}
                </span>
                <textarea value={inst} onChange={e => updateStep(i, e.target.value)} rows={2} className="input-field resize-none flex-1 text-sm" placeholder={`Schritt ${i + 1}…`} />
                <button onClick={() => removeStep(i)} className="text-charcoal-300 hover:text-red-400 text-lg leading-none mt-1" aria-label="Schritt entfernen">×</button>
              </div>
            ))}
          </div>

          <button onClick={addStep} className="btn-ghost text-sm">+ Schritt hinzufügen</button>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="btn-ghost">← Zurück</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Speichern…' : '✓ Änderungen speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
