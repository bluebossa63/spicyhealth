interface NutritionInfo {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

interface Props {
  nutrition: NutritionInfo;
  servings?: number;
}

export function NutritionPanel({ nutrition, servings = 1 }: Props) {
  const per = (v: number) => Math.round(v / servings);

  const macros = [
    { label: 'Protein', value: per(nutrition.proteinG), unit: 'g', color: 'bg-sage' },
    { label: 'Carbs', value: per(nutrition.carbsG), unit: 'g', color: 'bg-blush' },
    { label: 'Fat', value: per(nutrition.fatG), unit: 'g', color: 'bg-terracotta' },
    ...(nutrition.fiberG ? [{ label: 'Fiber', value: per(nutrition.fiberG), unit: 'g', color: 'bg-cream-dark' }] : []),
  ];

  const total = per(nutrition.proteinG) + per(nutrition.carbsG) + per(nutrition.fatG);

  return (
    <div className="card p-5">
      <h3 className="font-heading font-semibold text-charcoal mb-4">Nutrition per serving</h3>
      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-terracotta">{per(nutrition.calories)}</span>
        <span className="text-sm text-charcoal-light ml-1">kcal</span>
      </div>
      {/* Macro bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {macros.slice(0, 3).map(m => (
          <div key={m.label} className={`${m.color} opacity-80`} style={{ width: `${total ? (m.value / total) * 100 : 33}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {macros.map(m => (
          <div key={m.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${m.color}`} />
            <span className="text-xs text-charcoal-light">{m.label}</span>
            <span className="text-xs font-semibold text-charcoal ml-auto">{m.value}{m.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
