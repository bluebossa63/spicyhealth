interface DayTotals {
  totalNutrition: { calories: number; proteinG: number; carbsG: number; fatG: number };
  totalCostEur: number;
}

export function DayTotalsBar({ totals }: { totals: DayTotals }) {
  const { totalNutrition: n, totalCostEur } = totals;
  return (
    <div className="mt-2 text-xs text-charcoal-500 space-y-1">
      <div className="flex justify-between">
        <span>🔥 {Math.round(n.calories)} kcal</span>
        <span>💶 €{totalCostEur.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-charcoal-400">
        <span>P {Math.round(n.proteinG)}g</span>
        <span>C {Math.round(n.carbsG)}g</span>
        <span>F {Math.round(n.fatG)}g</span>
      </div>
    </div>
  );
}
