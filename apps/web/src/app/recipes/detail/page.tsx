'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { NutritionPanel } from '@/components/NutritionPanel';
import { SkeletonText } from '@/components/ui/SkeletonLoader';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function RecipeDetailPage() {
  return (
    <ProtectedRoute>
      <RecipeDetail />
    </ProtectedRoute>
  );
}

function RecipeDetail() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
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
      show(`Added to ${slot}!`, 'success');
    } catch { show('Failed to add', 'error'); }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { comment: c } = await api.recipes.addComment(id!, comment);
      setComments(prev => [...prev, c]);
      setComment('');
    } catch { show('Failed to post comment', 'error'); }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SkeletonText lines={8} />
    </div>
  );

  if (!recipe) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-charcoal-light">Recipe not found.</p>
      <Link href="/recipes" className="text-terracotta hover:underline text-sm mt-2 block">← Back to recipes</Link>
    </div>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/recipes" className="text-sm text-charcoal-light hover:text-terracotta transition-colors mb-6 block">
          ← Back to recipes
        </Link>

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden mb-8 h-72 bg-gradient-to-br from-blush-light to-cream-dark flex items-center justify-center">
          {recipe.imageUrl
            ? <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
            : <span className="text-7xl">🥗</span>}
        </div>

        {/* Title + meta */}
        <div className="mb-6">
          <span className="text-xs font-semibold text-terracotta uppercase tracking-wide capitalize">{recipe.category}</span>
          <h1 className="font-heading text-3xl text-charcoal mt-1 mb-3">{recipe.title}</h1>
          <p className="text-charcoal-light leading-relaxed">{recipe.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-charcoal-light mt-4">
            <span>⏱ Prep: {recipe.prepTimeMinutes} min</span>
            <span>🍳 Cook: {recipe.cookTimeMinutes} min</span>
            <span>🍽️ Serves: {recipe.servings}</span>
            <span>💰 €{recipe.estimatedCostEur?.toFixed(2)}</span>
          </div>
        </div>

        {/* Quick Add */}
        <button onClick={handleQuickAdd} className="btn-primary w-full mb-8">
          + Quick Add for Today
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Ingredients */}
          <div className="card p-5">
            <h2 className="font-heading font-semibold text-charcoal mb-4">Ingredients</h2>
            <ul className="flex flex-col gap-2">
              {recipe.ingredients?.map((ing: any, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-cream-dark last:border-0">
                  <span className="text-charcoal">{ing.quantity} {ing.unit} {ing.name}</span>
                  <div className="flex gap-3 text-charcoal-light text-xs">
                    {ing.calories && <span>{ing.calories} kcal</span>}
                    {ing.estimatedCostEur && <span>€{ing.estimatedCostEur.toFixed(2)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Nutrition */}
          {recipe.nutrition && <NutritionPanel nutrition={recipe.nutrition} servings={recipe.servings} />}
        </div>

        {/* Instructions */}
        <div className="card p-5 mb-8">
          <h2 className="font-heading font-semibold text-charcoal mb-4">Instructions</h2>
          <ol className="flex flex-col gap-4">
            {recipe.instructions?.map((step: string, i: number) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-terracotta text-white text-sm font-bold rounded-full flex items-center justify-center">{i + 1}</span>
                <p className="text-charcoal-light text-sm leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {recipe.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-cream-dark text-charcoal-light text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-charcoal mb-4">Comments ({comments.length})</h2>

          <form onSubmit={handleComment} className="flex gap-2 mb-6">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment…"
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary text-sm">Post</button>
          </form>

          {comments.length === 0 ? (
            <p className="text-charcoal-light text-sm text-center py-4">No comments yet. Be the first!</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {comments.map(c => (
                <li key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-blush rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white">
                    {c.userId?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <p className="text-sm text-charcoal leading-relaxed">{c.body}</p>
                    <p className="text-xs text-charcoal-light mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
