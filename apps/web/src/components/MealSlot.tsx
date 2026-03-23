'use client';
import { useDroppable } from '@dnd-kit/core';

interface MealSlotProps {
  id: string; // unique droppable id e.g. "2026-03-18-breakfast"
  date: string;
  slot: string;
  recipe: any | null;
  onClear: () => void;
  onPick: () => void;
}

export function MealSlot({ id, slot, recipe, onClear, onPick }: MealSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-xl border-2 transition-colors p-2 ${
        isOver
          ? 'border-terracotta-400 bg-terracotta-50'
          : recipe
          ? 'border-sage-200 bg-white'
          : 'border-dashed border-charcoal-200 bg-cream-50 hover:border-sage-300'
      }`}
    >
      {recipe ? (
        <div className="group relative">
          <div className="flex gap-2 items-start">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blush-100 to-sage-100 flex items-center justify-center text-lg shrink-0">🍽️</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-charcoal truncate leading-tight">{recipe.title}</p>
              <p className="text-xs text-charcoal-light">
                {recipe.nutrition?.calories ? `${Math.round(recipe.nutrition.calories / (recipe.servings || 1))} kcal` : ''}
                {recipe.estimatedCostEur ? ` · CHF ${(recipe.estimatedCostEur / (recipe.servings || 1)).toFixed(2)}` : ''}
              </p>
            </div>
          </div>
          {/* Action buttons — visible on hover */}
          <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onPick}
              aria-label="Rezept austauschen"
              title="Austauschen"
              className="w-5 h-5 bg-sage hover:bg-sage-dark text-white rounded-full text-[10px] flex items-center justify-center"
            >
              ↻
            </button>
            <button
              onClick={onClear}
              aria-label={`${recipe?.title ?? 'Rezept'} entfernen`}
              title="Entfernen"
              className="w-5 h-5 bg-charcoal-light hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onPick}
          aria-label="Rezept hinzufügen"
          className="w-full h-full min-h-[64px] flex items-center justify-center text-charcoal-light hover:text-sage transition-colors text-xl"
        >
          +
        </button>
      )}
    </div>
  );
}
