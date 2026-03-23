'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { RecipeImageUpload } from '@/components/RecipeImageUpload';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'smoothie'];
const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen',
  snack: 'Snack', dessert: 'Dessert', smoothie: 'Smoothie',
};

interface NutritionPer100g {
  calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number;
}

interface SearchResult {
  name: string;
  per100g: NutritionPer100g;
}

interface IngredientForm {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  estimatedCostEur: number;
  nutritionLoaded: boolean;
  nutritionLoading: boolean;
  searchResults?: SearchResult[];
  _per100g?: NutritionPer100g;
}

function toIngredientForm(ing: any): IngredientForm {
  return {
    name: ing.name || '',
    quantity: ing.quantity || 0,
    unit: ing.unit || 'g',
    calories: ing.calories || 0,
    proteinG: ing.proteinG || 0,
    carbsG: ing.carbsG || 0,
    fatG: ing.fatG || 0,
    fiberG: ing.fiberG || 0,
    estimatedCostEur: ing.estimatedCostEur || 0,
    nutritionLoaded: !!(ing.calories || ing.proteinG || ing.carbsG || ing.fatG),
    nutritionLoading: false,
  };
}

function emptyIngredient(): IngredientForm {
  return { name: '', quantity: 100, unit: 'g', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, estimatedCostEur: 0, nutritionLoaded: false, nutritionLoading: false };
}

export default function EditRecipePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-charcoal-light">Laden…</div>}>
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
    title: '', description: '', category: 'lunch', imageUrl: '',
    prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2,
    estimatedCostEur: 0,
    ingredients: [emptyIngredient()] as IngredientForm[],
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
        imageUrl: recipe.imageUrl || '',
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        estimatedCostEur: recipe.estimatedCostEur || 0,
        ingredients: recipe.ingredients?.length
          ? recipe.ingredients.map(toIngredientForm)
          : [emptyIngredient()],
        instructions: recipe.instructions?.length ? recipe.instructions : [''],
        tags: (recipe.tags || []).join(', '),
      });
    }).catch(() => router.push('/recipes'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  function addIngredient() {
    set('ingredients', [...form.ingredients, emptyIngredient()]);
  }
  function removeIngredient(i: number) {
    if (form.ingredients.length <= 1) return;
    set('ingredients', form.ingredients.filter((_, idx) => idx !== i));
  }
  function updateIngredient(i: number, key: string, value: any) {
    const ings = [...form.ingredients];
    ings[i] = { ...ings[i], [key]: value };

    if (key === 'quantity' && ings[i].nutritionLoaded && ings[i]._per100g) {
      const factor = Number(value) / 100;
      const p = ings[i]._per100g!;
      ings[i].calories = Math.round(p.calories * factor);
      ings[i].proteinG = Math.round(p.proteinG * factor * 10) / 10;
      ings[i].carbsG = Math.round(p.carbsG * factor * 10) / 10;
      ings[i].fatG = Math.round(p.fatG * factor * 10) / 10;
      ings[i].fiberG = Math.round(p.fiberG * factor * 10) / 10;
    }

    set('ingredients', ings);
  }

  const lookupNutrition = useCallback(async (index: number) => {
    const ing = form.ingredients[index];
    if (!ing.name.trim() || ing.nutritionLoading) return;

    const ings = [...form.ingredients];
    ings[index] = { ...ings[index], nutritionLoading: true, searchResults: undefined };
    set('ingredients', ings);

    try {
      const { products } = await api.nutrition.search(ing.name);
      if (products?.length > 0) {
        const results: SearchResult[] = products.slice(0, 8).map((p: any) => ({
          name: p.brands ? `${p.product_name} (${p.brands})` : (p.product_name || ing.name),
          per100g: {
            calories: p.nutriments?.['energy-kcal_100g'] || 0,
            proteinG: p.nutriments?.['proteins_100g'] || 0,
            carbsG: p.nutriments?.['carbohydrates_100g'] || 0,
            fatG: p.nutriments?.['fat_100g'] || 0,
            fiberG: p.nutriments?.['fiber_100g'] || 0,
          },
        })).filter((r: SearchResult) => r.per100g.calories > 0);

        if (results.length === 1) {
          applyNutrition(index, results[0].per100g);
        } else if (results.length > 1) {
          const updated = [...form.ingredients];
          updated[index] = { ...updated[index], nutritionLoading: false, searchResults: results };
          set('ingredients', updated);
        } else {
          const updated = [...form.ingredients];
          updated[index] = { ...updated[index], nutritionLoading: false };
          set('ingredients', updated);
        }
      } else {
        const updated = [...form.ingredients];
        updated[index] = { ...updated[index], nutritionLoading: false };
        set('ingredients', updated);
      }
    } catch {
      const updated = [...form.ingredients];
      updated[index] = { ...updated[index], nutritionLoading: false };
      set('ingredients', updated);
    }
  }, [form.ingredients]);

  function applyNutrition(index: number, per100g: NutritionPer100g) {
    const factor = form.ingredients[index].quantity / 100;
    const updated = [...form.ingredients];
    updated[index] = {
      ...updated[index],
      calories: Math.round(per100g.calories * factor),
      proteinG: Math.round(per100g.proteinG * factor * 10) / 10,
      carbsG: Math.round(per100g.carbsG * factor * 10) / 10,
      fatG: Math.round(per100g.fatG * factor * 10) / 10,
      fiberG: Math.round(per100g.fiberG * factor * 10) / 10,
      nutritionLoaded: true,
      nutritionLoading: false,
      searchResults: undefined,
      _per100g: per100g,
    };
    set('ingredients', updated);
  }

  function addStep() { set('instructions', [...form.instructions, '']); }
  function removeStep(i: number) { set('instructions', form.instructions.filter((_: string, idx: number) => idx !== i)); }
  function updateStep(i: number, value: string) {
    const steps = [...form.instructions];
    steps[i] = value;
    set('instructions', steps);
  }

  const computedNutrition = {
    calories: form.ingredients.reduce((s, i) => s + (i.calories || 0), 0),
    proteinG: form.ingredients.reduce((s, i) => s + (i.proteinG || 0), 0),
    carbsG: form.ingredients.reduce((s, i) => s + (i.carbsG || 0), 0),
    fatG: form.ingredients.reduce((s, i) => s + (i.fatG || 0), 0),
  };
  const computedCost = form.ingredients.reduce((s, i) => s + (i.estimatedCostEur || 0), 0);

  async function handleSubmit() {
    setError(''); setSaving(true);
    try {
      const cleanIngredients = form.ingredients
        .filter(i => i.name.trim())
        .map(({ nutritionLoaded, nutritionLoading, _per100g, ...rest }) => rest);
      await api.recipes.update(id!, {
        ...form,
        imageUrl: form.imageUrl || undefined,
        ingredients: cleanIngredients,
        instructions: form.instructions.filter((s: string) => s.trim()),
        estimatedCostEur: form.estimatedCostEur || computedCost,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      });
      router.push(`/recipes/detail?id=${id}`);
    } catch (err: any) {
      setError(err.message || 'Speichern fehlgeschlagen');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-charcoal-light">Rezept wird geladen…</div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-2">Rezept bearbeiten</h1>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-regency' : 'bg-rose-light'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-heading text-xl text-charcoal">Grundangaben</h2>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Titel *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field" placeholder="Avocado-Mango-Salat" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Beschreibung</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input-field resize-none" placeholder="Ein frischer, lebendiger Salat…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Kategorie</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-charcoal mb-1">Vorbereitung (min)</label><input type="number" min="0" value={form.prepTimeMinutes} onChange={e => set('prepTimeMinutes', Number(e.target.value))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-charcoal mb-1">Kochzeit (min)</label><input type="number" min="0" value={form.cookTimeMinutes} onChange={e => set('cookTimeMinutes', Number(e.target.value))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-charcoal mb-1">Portionen</label><input type="number" min="1" value={form.servings} onChange={e => set('servings', Number(e.target.value))} className="input-field" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Tags (kommagetrennt)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className="input-field" placeholder="vegan, schnell, glutenfrei" />
          </div>
          <RecipeImageUpload imageUrl={form.imageUrl} onImageChange={url => set('imageUrl', url)} />
          <button onClick={() => setStep(2)} className="btn-primary w-full">Weiter: Zutaten →</button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-heading text-xl text-charcoal">Zutaten</h2>
          <div className="flex flex-col gap-3">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="border border-cream-dark rounded-xl p-3">
                <div className="grid grid-cols-[1fr_80px_60px_32px] gap-2 items-end">
                  <div>
                    {i === 0 && <label className="block text-sm font-medium text-charcoal mb-1">Zutat</label>}
                    <input
                      value={ing.name}
                      onChange={e => updateIngredient(i, 'name', e.target.value)}
                      onBlur={() => !ing.nutritionLoaded && ing.name.trim() && lookupNutrition(i)}
                      className="input-field text-sm" placeholder="z.B. Haferflocken"
                    />
                  </div>
                  <div>
                    {i === 0 && <label className="block text-sm font-medium text-charcoal mb-1">Menge</label>}
                    <input type="number" min="0" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} className="input-field text-sm" />
                  </div>
                  <div>
                    {i === 0 && <label className="block text-sm font-medium text-charcoal mb-1">Einheit</label>}
                    <input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} className="input-field text-sm" placeholder="g" />
                  </div>
                  <button onClick={() => removeIngredient(i)} className="text-charcoal-light hover:text-red-500 text-lg pb-1" title="Entfernen">×</button>
                </div>

                {ing.nutritionLoading && (
                  <p className="text-xs text-charcoal-light mt-2 animate-pulse">Nährwerte werden geladen...</p>
                )}
                {ing.nutritionLoaded && (
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-charcoal-light">
                    <span className="bg-cream rounded-lg px-2 py-0.5">🔥 {ing.calories} kcal</span>
                    <span className="bg-cream rounded-lg px-2 py-0.5">💪 {ing.proteinG}g Eiweiss</span>
                    <span className="bg-cream rounded-lg px-2 py-0.5">🍞 {ing.carbsG}g Kohlenhydrate</span>
                    <span className="bg-cream rounded-lg px-2 py-0.5">🥑 {ing.fatG}g Fett</span>
                  </div>
                )}
                {/* Search results — pick the right product */}
                {ing.searchResults && ing.searchResults.length > 1 && (
                  <div className="mt-2 border border-rose-light rounded-lg overflow-hidden">
                    <p className="text-xs font-medium text-charcoal px-2 py-1 bg-rose-light">Welches Produkt meinst du?</p>
                    {ing.searchResults.map((result, ri) => (
                      <button
                        key={ri}
                        onClick={() => applyNutrition(i, result.per100g)}
                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-cream-dark transition-colors border-t border-cream-dark flex justify-between items-center"
                      >
                        <span className="font-medium text-charcoal truncate flex-1">{result.name}</span>
                        <span className="text-charcoal-light ml-2 shrink-0">{Math.round(result.per100g.calories)} kcal/100g</span>
                      </button>
                    ))}
                  </div>
                )}
                {!ing.nutritionLoaded && !ing.nutritionLoading && !ing.searchResults && ing.name.trim() && (
                  <button onClick={() => lookupNutrition(i)} className="text-xs text-regency hover:text-regency-dark mt-2">
                    Nährwerte suchen
                  </button>
                )}
                {ing.nutritionLoaded && (
                  <button onClick={() => lookupNutrition(i)} className="text-xs text-charcoal-light hover:text-regency mt-1">
                    Anderes Produkt wählen
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addIngredient} className="btn-ghost text-sm">+ Zutat hinzufügen</button>

          <div className="bg-sage-light rounded-xl p-4 text-sm">
            <p className="font-semibold text-charcoal mb-2">Gesamtwerte pro Portion</p>
            <div className="grid grid-cols-2 gap-2 text-charcoal">
              <span>🔥 {Math.round(computedNutrition.calories / (form.servings || 1))} kcal</span>
              <span>💪 {(computedNutrition.proteinG / (form.servings || 1)).toFixed(1)}g Eiweiss</span>
              <span>🍞 {(computedNutrition.carbsG / (form.servings || 1)).toFixed(1)}g Kohlenhydrate</span>
              <span>🥑 {(computedNutrition.fatG / (form.servings || 1)).toFixed(1)}g Fett</span>
            </div>
            <p className="text-charcoal-light mt-2">💰 CHF {computedCost.toFixed(2)} total</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-ghost">← Zurück</button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1">Weiter: Zubereitung →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-heading text-xl text-charcoal">Zubereitung</h2>
          <div className="space-y-3">
            {form.instructions.map((inst: string, i: number) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-regency text-white text-sm font-bold flex items-center justify-center mt-1">{i + 1}</span>
                <textarea value={inst} onChange={e => updateStep(i, e.target.value)} rows={2} className="input-field resize-none flex-1 text-sm" placeholder={`Schritt ${i + 1}…`} />
                <button onClick={() => removeStep(i)} className="text-charcoal-light hover:text-red-500 text-lg leading-none mt-1" title="Entfernen">×</button>
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
