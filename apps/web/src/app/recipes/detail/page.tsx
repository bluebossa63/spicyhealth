'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { NutritionPanel } from '@/components/NutritionPanel';
import { CommentThread } from '@/components/CommentThread';
import { SkeletonText } from '@/components/ui/SkeletonLoader';
import { Toast, useToast } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

export default function RecipeDetailPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8"><SkeletonText lines={8} /></div>}>
        <RecipeDetail />
      </Suspense>
    </ProtectedRoute>
  );
}

function RecipeDetail() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.get('id');
  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const { toast, show, hide } = useToast();

  useEffect(() => {
    if (!id) { router.push('/recipes'); return; }
    Promise.all([
      api.recipes.get(id).then(d => setRecipe(d.recipe)).catch(() => {}),
      api.recipes.getComments(id).then(d => setComments(d.comments)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  async function handleQuickAdd() {
    try {
      const { slot } = await api.recipes.quickAdd(id!);
      show(`Zu ${slot} hinzugefügt!`, 'success');
    } catch { show('Hinzufügen fehlgeschlagen', 'error'); }
  }

  async function handleDelete() {
    if (!id || !confirm('Rezept wirklich löschen?')) return;
    try {
      await api.recipes.delete(id);
      router.push('/recipes');
    } catch { show('Löschen fehlgeschlagen', 'error'); }
  }

  async function handleSave() {
    if (!id) return;
    try {
      if (saved) {
        await api.users.unsaveRecipe(id);
        setSaved(false);
        show('Aus gespeicherten Rezepten entfernt', 'success');
      } else {
        await api.users.saveRecipe(id);
        setSaved(true);
        show('Rezept gespeichert!', 'success');
      }
    } catch { show('Gespeicherten Status konnte nicht aktualisiert werden', 'error'); }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SkeletonText lines={8} />
    </div>
  );

  if (!recipe) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-charcoal-400 text-lg">Rezept nicht gefunden.</p>
      <Link href="/recipes" className="btn-primary mt-4 inline-block">Zurück zu den Rezepten</Link>
    </div>
  );

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}

      {/* Hero */}
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-2xl mb-6" />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-rose-light to-pistachio-light rounded-2xl mb-6 flex items-center justify-center text-6xl">
          🍽️
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-6">
        <span className="inline-block px-3 py-1 bg-rose-light text-blush-700 text-xs font-semibold rounded-full uppercase tracking-wide mb-3">
          {recipe.category}
        </span>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl text-charcoal-800 leading-tight">{recipe.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {user?.id === recipe?.authorId && (
              <>
                <Link href={`/recipes/edit?id=${recipe.id}`} className="btn-secondary text-sm px-3 py-1.5">
                  ✏️ Bearbeiten
                </Link>
                <button
                  onClick={handleDelete}
                  className="btn-ghost text-sm px-3 py-1.5 text-red-500 hover:text-red-700"
                >
                  🗑 Löschen
                </button>
              </>
            )}
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Schau dir dieses Rezept an: ${recipe.title} — ${url}`;
                if (navigator.share) {
                  navigator.share({ title: recipe.title, text: recipe.description, url });
                } else {
                  navigator.clipboard.writeText(text);
                  alert('Link kopiert! Du kannst ihn jetzt teilen.');
                }
              }}
              className="text-charcoal-light hover:text-regency transition-colors text-sm"
              title="Rezept teilen"
            >
              📤 Teilen
            </button>
            <button
              onClick={handleSave}
              className={`text-2xl transition-colors ${saved ? 'text-regency-dark' : 'text-charcoal-300 hover:text-regency-400'}`}
            >
              {saved ? '♥' : '♡'}
            </button>
          </div>
        </div>
        <p className="text-charcoal-500 mt-2 leading-relaxed">{recipe.description}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-charcoal-500">
          <span>⏱ {totalTime} min</span>
          <span>👤 {recipe.servings} Portionen</span>
          {recipe.estimatedCostEur > 0 && <span>💰 CHF {recipe.estimatedCostEur.toFixed(2)}</span>}
          {recipe.tags?.map((t: string) => (
            <span key={t} className="px-2 py-0.5 bg-cream-100 rounded-full text-xs">{t}</span>
          ))}
        </div>
        <button onClick={handleQuickAdd} className="btn-primary mt-4">
          + Schnell zu heute hinzufügen
        </button>
      </div>

      {/* Ingredients */}
      <section className="card p-6 mb-6">
        <h2 className="font-display text-xl text-charcoal-800 mb-4">Zutaten</h2>
        <ul className="space-y-2">
          {recipe.ingredients?.map((ing: any, i: number) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-charcoal-700">{ing.name}</span>
              <div className="flex items-center gap-4 text-charcoal-400">
                <span>{ing.quantity} {ing.unit}</span>
                {ing.calories && <span>{ing.calories} kcal</span>}
                {ing.estimatedCostEur && <span>CHF {ing.estimatedCostEur.toFixed(2)}</span>}
              </div>
            </li>
          ))}
        </ul>
        {recipe.estimatedCostEur > 0 && (
          <div className="border-t border-cream-200 mt-4 pt-3 flex justify-between text-sm font-semibold text-charcoal-700">
            <span>Gesamtkosten</span>
            <span>CHF {recipe.estimatedCostEur.toFixed(2)} (CHF {(recipe.estimatedCostEur / recipe.servings).toFixed(2)} / Portion)</span>
          </div>
        )}
      </section>

      {/* Nutrition */}
      {recipe.nutrition && <div className="mb-6"><NutritionPanel nutrition={recipe.nutrition} servings={recipe.servings} /></div>}

      {/* Instructions */}
      <section className="card p-6 mb-6">
        <h2 className="font-display text-xl text-charcoal-800 mb-4">Zubereitung</h2>
        <ol className="space-y-4">
          {recipe.instructions?.map((step: string, i: number) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-regency-light text-regency-dark text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-charcoal-700 leading-relaxed pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Comments */}
      <section className="card p-6">
        <CommentThread recipeId={id!} initialComments={comments} />
      </section>
    </main>
  );
}
