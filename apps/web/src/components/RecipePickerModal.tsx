'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface RecipePickerModalProps {
  onSelect: (recipe: any) => void;
  onClose: () => void;
}

export function RecipePickerModal({ onSelect, onClose }: RecipePickerModalProps) {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.recipes.list({ search: search || undefined, pageSize: 20 })
        .then(d => setRecipes(d.recipes))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-cream-200">
          <h3 className="font-display text-lg text-charcoal-800 mb-3">Pick a recipe</h3>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="input-field"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="text-center text-charcoal-400 py-8 text-sm">Loading…</p>}
          {!loading && recipes.length === 0 && (
            <p className="text-center text-charcoal-400 py-8 text-sm">No recipes found</p>
          )}
          {recipes.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors text-left"
            >
              {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blush-100 to-sage-100 flex items-center justify-center text-xl shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-charcoal-800 truncate">{recipe.title}</p>
                <p className="text-xs text-charcoal-400">
                  {recipe.nutrition?.calories ? `${recipe.nutrition.calories} kcal` : ''}
                  {recipe.estimatedCostEur ? ` · €${recipe.estimatedCostEur.toFixed(2)}` : ''}
                  {recipe.prepTimeMinutes ? ` · ${recipe.prepTimeMinutes + recipe.cookTimeMinutes}min` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-cream-200">
          <button onClick={onClose} className="btn-ghost w-full">Cancel</button>
        </div>
      </div>
    </div>
  );
}
