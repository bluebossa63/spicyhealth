'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { RecipeImageUpload } from '@/components/RecipeImageUpload';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'smoothie'];
const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen',
  snack: 'Snack', dessert: 'Dessert', smoothie: 'Smoothie',
};

export default function NewRecipePage() {
  return <ProtectedRoute><NewRecipeForm /></ProtectedRoute>;
}

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

function emptyIngredient(): IngredientForm {
  return { name: '', quantity: 100, unit: 'g', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, estimatedCostEur: 0, nutritionLoaded: false, nutritionLoading: false };
}

function NewRecipeForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'lunch', imageUrl: '',
    prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 2,
    estimatedCostEur: 5,
    ingredients: [emptyIngredient()] as IngredientForm[],
    instructions: [''],
    tags: '',
  });

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

    // Recalculate nutrition when quantity changes and nutrition was loaded
    if (key === 'quantity' && ings[i].nutritionLoaded && ings[i]._per100g) {
      const factor = Number(value) / 100;
      const p = (ings[i] as any)._per100g;
      ings[i].calories = Math.round(p.calories * factor);
      ings[i].proteinG = Math.round(p.proteinG * factor * 10) / 10;
      ings[i].carbsG = Math.round(p.carbsG * factor * 10) / 10;
      ings[i].fatG = Math.round(p.fatG * factor * 10) / 10;
      ings[i].fiberG = Math.round(p.fiberG * factor * 10) / 10;
    }

    set('ingredients', ings);
  }

  // Lookup nutrition from Open Food Facts — shows results for user to pick
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
          // Only one result — apply directly
          applyNutrition(index, results[0].per100g);
        } else if (results.length > 1) {
          // Multiple results — show selection
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
    setError(''); setLoading(true);
    try {
      const cleanIngredients = form.ingredients
        .filter(i => i.name.trim())
        .map(({ nutritionLoaded, nutritionLoading, _per100g, ...rest }: any) => rest);
      const { recipe } = await api.recipes.create({
        ...form,
        imageUrl: form.imageUrl || undefined,
        ingredients: cleanIngredients,
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
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-regency' : 'bg-rose-light'}`} />
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
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Vorbereitung (min)" type="number" value={form.prepTimeMinutes} onChange={e => set('prepTimeMinutes', Number(e.target.value))} />
              <Input label="Kochzeit (min)" type="number" value={form.cookTimeMinutes} onChange={e => set('cookTimeMinutes', Number(e.target.value))} />
              <Input label="Portionen" type="number" value={form.servings} onChange={e => set('servings', Number(e.target.value))} />
            </div>
            <Input label="Geschätzte Kosten (CHF)" type="number" step="0.5" value={form.estimatedCostEur} onChange={e => set('estimatedCostEur', Number(e.target.value))} />
            <Input label="Tags (kommagetrennt)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="vegan, schnell, glutenfrei" />
            <RecipeImageUpload imageUrl={form.imageUrl} onImageChange={url => set('imageUrl', url)} />
            <Button onClick={() => setStep(2)} className="w-full">Weiter: Zutaten →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Zutaten</h2>
          <div className="flex flex-col gap-3">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="border border-cream-dark rounded-xl p-3">
                <div className="grid grid-cols-[1fr_80px_60px_32px] gap-2 items-end">
                  <Input
                    label={i === 0 ? 'Zutat' : ''}
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                    onBlur={() => !ing.nutritionLoaded && ing.name.trim() && lookupNutrition(i)}
                    placeholder="z.B. Haferflocken"
                  />
                  <Input label={i === 0 ? 'Menge' : ''} type="number" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} />
                  <Input label={i === 0 ? 'Einheit' : ''} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="g" />
                  <button onClick={() => removeIngredient(i)} className="text-charcoal-light hover:text-red-500 text-lg pb-1" title="Entfernen">×</button>
                </div>

                {/* Nutrition display */}
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
            <button onClick={addIngredient} className="btn-ghost text-sm mt-1">+ Zutat hinzufügen</button>
          </div>

          {/* Totals */}
          <div className="bg-sage-light rounded-xl p-4 text-sm mt-4">
            <p className="font-semibold text-charcoal mb-2">Gesamtwerte pro Portion</p>
            <div className="grid grid-cols-2 gap-2 text-charcoal">
              <span>🔥 {Math.round(computedNutrition.calories / (form.servings || 1))} kcal</span>
              <span>💪 {(computedNutrition.proteinG / (form.servings || 1)).toFixed(1)}g Eiweiss</span>
              <span>🍞 {(computedNutrition.carbsG / (form.servings || 1)).toFixed(1)}g Kohlenhydrate</span>
              <span>🥑 {(computedNutrition.fatG / (form.servings || 1)).toFixed(1)}g Fett</span>
            </div>
            <p className="text-charcoal-light mt-2">💰 CHF {computedCost.toFixed(2)} total</p>
          </div>

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
                <span className="flex-shrink-0 w-6 h-6 bg-regency text-white text-xs font-bold rounded-full flex items-center justify-center mt-2.5">{i + 1}</span>
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
