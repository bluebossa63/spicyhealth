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
              <p className="text-xs font-semibold text-charcoal-800 truncate leading-tight">{recipe.title}</p>
              <p className="text-xs text-charcoal-400">
                {recipe.nutrition?.calories ? `${Math.round(recipe.nutrition.calories / (recipe.servings || 1))} kcal` : ''}
                {recipe.estimatedCostEur ? ` · CHF ${recipe.estimatedCostEur.toFixed(2)}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            aria-label={`${recipe?.title ?? 'Rezept'} entfernen`}
            className="absolute -top-1 -right-1 w-5 h-5 bg-charcoal-400 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={onPick}
          aria-label="Rezept hinzufügen"
          className="w-full h-full min-h-[64px] flex items-center justify-center text-charcoal-300 hover:text-sage-500 transition-colors text-xl"
        >
          +
        </button>
      )}
    </div>
  );
}
