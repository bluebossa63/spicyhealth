'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Toast } from '@/components/ui/Toast';

interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  nutrition: { calories: number };
  estimatedCostEur: number;
  tags?: string[];
}

interface Props {
  recipe: Recipe;
  onSaveToggle?: (id: string) => void;
  saved?: boolean;
}

export function RecipeCard({ recipe, onSaveToggle, saved = false }: Props) {
  const { toast, show, hide } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    setIsAdding(true);
    try {
      const { slot } = await api.recipes.quickAdd(recipe.id);
      show(`Zu ${slot} hinzugefügt!`, 'success');
    } catch {
      show('Bitte zuerst anmelden', 'error');
    } finally {
      setIsAdding(false);
    }
  }

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}
      <Link href={`/recipes/detail?id=${recipe.id}`} className="group block">
        <div className="card overflow-hidden h-full flex flex-col group-hover:shadow-card-hover transition-shadow">
          {/* Image */}
          <div className="relative h-48 bg-gradient-to-br from-rose-light to-cream-dark flex-shrink-0">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🥗</div>
            )}
            {/* Category chip */}
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-full text-regency-dark capitalize">
              {recipe.category}
            </span>
            {/* Save button */}
            <button
              onClick={e => { e.preventDefault(); onSaveToggle?.(recipe.id); }}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <span className={saved ? 'text-regency-dark' : 'text-charcoal-light'}>♥</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-2 flex-1">
            <h3 className="font-heading font-semibold text-charcoal leading-snug line-clamp-2">{recipe.title}</h3>
            <p className="text-xs text-charcoal-light leading-relaxed line-clamp-2 flex-1">{recipe.description}</p>

            {/* Meta badges */}
            <div className="flex gap-3 text-xs text-charcoal-light mt-1">
              <span>⏱ {totalTime} min</span>
              <span>🔥 {Math.round(recipe.nutrition.calories / (recipe.servings || 1))} kcal</span>
              <span>💰 CHF {recipe.estimatedCostEur.toFixed(2)}</span>
            </div>

            {/* Quick Add */}
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="btn-primary text-xs py-2 w-full mt-2"
            >
              {isAdding ? 'Wird hinzugefügt…' : '+ Schnell zu heute hinzufügen'}
            </button>
          </div>
        </div>
      </Link>
    </>
  );
}
