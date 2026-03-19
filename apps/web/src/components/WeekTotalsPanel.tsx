interface WeekTotalsPanelProps {
  days: any[];
}

export function WeekTotalsPanel({ days }: WeekTotalsPanelProps) {
  const totals = days.reduce(
    (acc, day) => {
      acc.calories += day.totalNutrition?.calories || 0;
      acc.proteinG += day.totalNutrition?.proteinG || 0;
      acc.carbsG += day.totalNutrition?.carbsG || 0;
      acc.fatG += day.totalNutrition?.fatG || 0;
      acc.cost += day.totalCostEur || 0;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, cost: 0 }
  );

  const activeDays = days.filter(d =>
    d.breakfast || d.lunch || d.dinner || (d.snacks && d.snacks.length > 0)
  ).length;

  return (
    <div className="card p-4 mt-6">
      <h3 className="font-display text-lg text-charcoal-800 mb-3">Wochensumme</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Kalorien', value: `${Math.round(totals.calories)} kcal`, icon: '🔥' },
          { label: 'Eiweiß', value: `${Math.round(totals.proteinG)}g`, icon: '💪' },
          { label: 'Kohlenhydrate', value: `${Math.round(totals.carbsG)}g`, icon: '🌾' },
          { label: 'Fett', value: `${Math.round(totals.fatG)}g`, icon: '🥑' },
          { label: 'Gesch. Kosten', value: `CHF ${totals.cost.toFixed(2)}`, icon: '💰' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-cream-50 rounded-xl p-3 text-center">
            <div className="text-lg mb-1">{icon}</div>
            <div className="font-semibold text-charcoal-800 text-sm">{value}</div>
            <div className="text-xs text-charcoal-400">{label}</div>
          </div>
        ))}
      </div>
      {activeDays > 0 && (
        <p className="text-xs text-charcoal-400 mt-3 text-center">
          Ø pro Tag: {Math.round(totals.calories / activeDays)} kcal · CHF {(totals.cost / activeDays).toFixed(2)}
        </p>
      )}
    </div>
  );
}
