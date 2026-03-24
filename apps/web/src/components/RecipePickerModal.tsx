'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const SLOT_CATEGORY: Record<string, string> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snacks: 'snack',
};

const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snacks: 'Snack',
};

interface RecipePickerModalProps {
  onSelect: (recipe: any) => void;
  onClose: () => void;
  slot?: string;
}

export function RecipePickerModal({ onSelect, onClose, slot }: RecipePickerModalProps) {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const category = !showAll && slot ? SLOT_CATEGORY[slot] : undefined;

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.recipes.list({ search: search || undefined, category, pageSize: 100 })
        .then(d => {
          const sorted = d.recipes.sort((a: any, b: any) => a.title.localeCompare(b.title, 'de'));
          setRecipes(sorted);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-cream-200">
          <h3 className="font-heading text-lg text-charcoal mb-1">
            Rezept auswählen
          </h3>
          {slot && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-charcoal-light">
                {showAll ? 'Alle Kategorien' : `Kategorie: ${SLOT_LABELS[slot] || slot}`}
              </span>
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-regency hover:text-regency-dark"
              >
                {showAll ? `Nur ${SLOT_LABELS[slot]}` : 'Alle anzeigen'}
              </button>
            </div>
          )}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rezepte suchen…"
            className="input-field"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="text-center text-charcoal-400 py-8 text-sm">Laden…</p>}
          {!loading && recipes.length === 0 && (
            <p className="text-center text-charcoal-400 py-8 text-sm">Keine Rezepte gefunden</p>
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
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-light to-pistachio-light flex items-center justify-center text-xl shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-charcoal-800 truncate">{recipe.title}</p>
                <p className="text-xs text-charcoal-400">
                  {recipe.nutrition?.calories ? `${Math.round(recipe.nutrition.calories / (recipe.servings || 1))} kcal` : ''}
                  {recipe.estimatedCostEur ? ` · CHF ${(recipe.estimatedCostEur / (recipe.servings || 1)).toFixed(2)}` : ''}
                  {recipe.prepTimeMinutes ? ` · ${recipe.prepTimeMinutes + recipe.cookTimeMinutes}min` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-cream-200">
          <button onClick={onClose} className="btn-ghost w-full">Abbrechen</button>
        </div>
      </div>
    </div>
  );
}
