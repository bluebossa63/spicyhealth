'use client';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'smoothie'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  breakfast: '🌅 Frühstück', lunch: '🥗 Mittagessen', dinner: '🍽️ Abendessen',
  snack: '🍎 Snack', dessert: '🍓 Dessert', smoothie: '🥤 Smoothie',
};

export interface Filters {
  category: string;
  maxCalories: number;
  maxPrepTime: number;
  maxCost: number;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  const set = (key: keyof Filters, value: any) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-5">
      {/* Category chips */}
      <div>
        <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">Kategorie</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => set('category', '')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${!filters.category ? 'bg-terracotta text-white' : 'bg-cream-dark text-charcoal-light hover:bg-blush-light'}`}
          >
            Alle
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => set('category', filters.category === cat ? '' : cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filters.category === cat ? 'bg-terracotta text-white' : 'bg-cream-dark text-charcoal-light hover:bg-blush-light'}`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div>
        <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">
          Max. Kalorien <span className="text-terracotta">{filters.maxCalories === 1500 ? 'Beliebig' : `${filters.maxCalories} kcal`}</span>
        </p>
        <input type="range" min={100} max={1500} step={50} value={filters.maxCalories}
          onChange={e => set('maxCalories', Number(e.target.value))}
          className="w-full accent-terracotta" />
      </div>

      <div>
        <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">
          Max. Vorbereitungszeit <span className="text-terracotta">{filters.maxPrepTime === 120 ? 'Beliebig' : `${filters.maxPrepTime} min`}</span>
        </p>
        <input type="range" min={5} max={120} step={5} value={filters.maxPrepTime}
          onChange={e => set('maxPrepTime', Number(e.target.value))}
          className="w-full accent-terracotta" />
      </div>

      <div>
        <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wide mb-2">
          Max. Kosten <span className="text-terracotta">{filters.maxCost === 30 ? 'Beliebig' : `€${filters.maxCost}`}</span>
        </p>
        <input type="range" min={1} max={30} step={1} value={filters.maxCost}
          onChange={e => set('maxCost', Number(e.target.value))}
          className="w-full accent-terracotta" />
      </div>

      <button
        onClick={() => onChange({ category: '', maxCalories: 1500, maxPrepTime: 120, maxCost: 30 })}
        className="text-xs text-charcoal-light hover:text-terracotta transition-colors text-left"
      >
        Filter zurücksetzen
      </button>
    </div>
  );
}
