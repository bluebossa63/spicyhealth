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

  async function handleSubmit() {
    setError(''); setLoading(true);
    try {
      const { recipe } = await api.recipes.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      router.push(`/recipes/detail?id=${recipe.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-2">New Recipe</h1>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-terracotta' : 'bg-blush-light'}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Basic info</h2>
          <div className="flex flex-col gap-4">
            <Input label="Title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Avocado & Mango Salad" required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-charcoal">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="A fresh, vibrant salad…"
                className="input-field resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-charcoal">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Prep (min)" type="number" value={form.prepTimeMinutes} onChange={e => set('prepTimeMinutes', Number(e.target.value))} />
              <Input label="Cook (min)" type="number" value={form.cookTimeMinutes} onChange={e => set('cookTimeMinutes', Number(e.target.value))} />
              <Input label="Servings" type="number" value={form.servings} onChange={e => set('servings', Number(e.target.value))} />
            </div>
            <Input label="Estimated cost (€)" type="number" step="0.5" value={form.estimatedCostEur} onChange={e => set('estimatedCostEur', Number(e.target.value))} />
            <Input label="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="vegan, quick, gluten-free" />
            <Button onClick={() => setStep(2)} className="w-full">Next: Ingredients →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Ingredients</h2>
          <div className="flex flex-col gap-3">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end">
                <div className="col-span-2"><Input label={i === 0 ? 'Ingredient' : ''} value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} placeholder="Avocado" /></div>
                <Input label={i === 0 ? 'Qty' : ''} type="number" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} />
                <Input label={i === 0 ? 'Unit' : ''} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} placeholder="g" />
              </div>
            ))}
            <button onClick={addIngredient} className="btn-ghost text-sm mt-1">+ Add ingredient</button>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1">Next: Instructions →</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="font-heading text-xl text-charcoal mb-4">Instructions</h2>
          <div className="flex flex-col gap-3">
            {form.instructions.map((step_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-terracotta text-white text-xs font-bold rounded-full flex items-center justify-center mt-2.5">{i + 1}</span>
                <textarea value={step_} onChange={e => updateStep(i, e.target.value)}
                  rows={2} placeholder={`Step ${i + 1}…`}
                  className="input-field flex-1 resize-none text-sm" />
              </div>
            ))}
            <button onClick={addStep} className="btn-ghost text-sm mt-1">+ Add step</button>
          </div>
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? 'Saving…' : '🎉 Publish Recipe'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
