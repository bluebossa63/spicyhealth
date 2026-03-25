'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Toast } from '@/components/ui/Toast';

const CATEGORY_DE: Record<string, string> = {
  breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen',
  snack: 'Snack', dessert: 'Dessert', smoothie: 'Smoothie',
};

const SLOT_DE: Record<string, string> = {
  breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen', snacks: 'Snack',
};

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
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    setIsAdding(true);
    try {
      const { slot } = await api.recipes.quickAdd(recipe.id);
      show(`Zu ${SLOT_DE[slot] || slot} hinzugefügt!`, 'success');
    } catch {
      show('Bitte zuerst anmelden', 'error');
    } finally {
      setIsAdding(false);
    }
  }

  async function handlePlanAdd(e: React.MouseEvent, date: string, slot: string) {
    e.preventDefault();
    setShowPlanPicker(false);
    setIsAdding(true);
    try {
      const { mealPlan } = await api.mealPlans.current();
      await api.mealPlans.updateSlot(mealPlan.id, date, slot, recipe);
      const dayLabel = new Date(date + 'T00:00:00Z').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
      show(`${SLOT_DE[slot]} am ${dayLabel} geplant!`, 'success');
    } catch {
      show('Bitte zuerst anmelden', 'error');
    } finally { setIsAdding(false); }
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
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-full text-regency-dark">
              {CATEGORY_DE[recipe.category] || recipe.category}
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

            {/* Plan buttons */}
            <div className="flex gap-2 mt-2 relative">
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="btn-primary text-xs py-2 flex-1"
              >
                {isAdding ? '...' : 'Für heute'}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setShowPlanPicker(!showPlanPicker); }}
                className="btn-secondary text-xs py-2 flex-1"
              >
                Planer
              </button>
              {showPlanPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); setShowPlanPicker(false); }} />
                  <div className="absolute bottom-full right-0 mb-1 z-50 bg-white rounded-xl shadow-lg border border-cream-dark p-3 min-w-[220px]" onClick={e => e.preventDefault()}>
                    <p className="text-xs font-medium text-charcoal mb-2">Tag & Mahlzeit wählen:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().slice(0, 10);
                        const dayLabel = d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
                        return (
                          <div key={dateStr}>
                            <p className="text-[10px] text-charcoal-light font-medium mt-1">{dayLabel}</p>
                            <div className="flex gap-1">
                              {(['breakfast', 'lunch', 'dinner'] as const).map(slot => (
                                <button
                                  key={slot}
                                  onClick={(e) => handlePlanAdd(e, dateStr, slot)}
                                  className="text-[10px] px-2 py-1 rounded-lg bg-cream hover:bg-regency-light transition-colors flex-1"
                                >
                                  {SLOT_DE[slot]}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
