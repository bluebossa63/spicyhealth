'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MealSlot } from '@/components/MealSlot';
import { RecipePickerModal } from '@/components/RecipePickerModal';
import { DayTotalsBar } from '@/components/DayTotalsBar';
import { WeekTotalsPanel } from '@/components/WeekTotalsPanel';
import { api } from '@/lib/api';
import { ShareMenu } from '@/components/ShareMenu';
import Link from 'next/link';

const SEASONAL_HINTS: Record<number, string[]> = {
  0: ['Rüebli','Lauch','Rosenkohl','Kabis'],
  1: ['Nüsslisalat','Rüebli','Lauch','Chicorée'],
  2: ['Spinat','Bärlauch','Rhabarber','Rüebli'],
  3: ['Spargel','Spinat','Radieschen','Rhabarber'],
  4: ['Spargel','Erdbeeren','Kohlrabi','Kopfsalat'],
  5: ['Erdbeeren','Kirschen','Zucchetti','Gurken'],
  6: ['Tomaten','Heidelbeeren','Peperoni','Aprikosen'],
  7: ['Tomaten','Pflaumen','Mais','Pfirsiche'],
  8: ['Trauben','Äpfel','Kürbis','Birnen'],
  9: ['Kürbis','Äpfel','Randen','Süsskartoffeln'],
  10: ['Kürbis','Federkohl','Rüebli','Lauch'],
  11: ['Rosenkohl','Rüebli','Mandarinen','Nüsse'],
};

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
const SLOT_LABELS: Record<string, string> = {
  breakfast: '☀️ Frühstück',
  lunch: '🥗 Mittagessen',
  dinner: '🍽️ Abendessen',
  snacks: '🍎 Snack',
};
const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getWeekStart(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function MealPlannerPage() {
  return (
    <ProtectedRoute>
      <MealPlanner />
    </ProtectedRoute>
  );
}

function MealPlanner() {
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [picker, setPicker] = useState<{ date: string; slot: string } | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<any>(null);
  const [autoPlanning, setAutoPlanning] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoSlots, setAutoSlots] = useState({ breakfast: true, lunch: true, dinner: true });
  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Mon=0 … Sun=6
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadPlan = useCallback(async (offset: number) => {
    setLoading(true);
    try {
      const weekStart = getWeekStart(offset);
      const { mealPlan } = offset === 0
        ? await api.mealPlans.current()
        : await api.mealPlans.forWeek(weekStart);
      setMealPlan(mealPlan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlan(weekOffset); }, [weekOffset, loadPlan]);

  async function handleAssign(date: string, slot: string, recipe: any) {
    if (!mealPlan) return;
    try {
      const { mealPlan: updated } = await api.mealPlans.updateSlot(mealPlan.id, date, slot, recipe);
      setMealPlan(updated);
    } catch (e) { console.error(e); }
  }

  async function handleClear(date: string, slot: string, snackIndex?: number) {
    if (!mealPlan) return;
    try {
      const { mealPlan: updated } = await api.mealPlans.removeSlot(mealPlan.id, date, slot, snackIndex);
      setMealPlan(updated);
    } catch (e) { console.error(e); }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveRecipe(event.active.data.current?.recipe);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveRecipe(null);
    const { active, over } = event;
    if (!over || !mealPlan) return;
    const recipe = active.data.current?.recipe;
    if (!recipe) return;
    // droppable id format: "{date}-{slot}"
    const overId = over.id as string;
    const lastDash = overId.lastIndexOf('-');
    const date = overId.slice(0, lastDash);
    const slot = overId.slice(lastDash + 1);
    await handleAssign(date, slot, recipe);
  }

  if (loading) return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-cream-200 rounded-lg w-48" />
        <div className="h-64 bg-cream-100 rounded-2xl" />
      </div>
    </main>
  );

  const weekStart = mealPlan?.weekStart || getWeekStart(weekOffset);
  const days: any[] = mealPlan?.days || [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header + week navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-charcoal-800">Mahlzeitenplaner</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost px-3 py-2 text-lg">‹</button>
          <span className="text-sm text-charcoal-600 min-w-[120px] text-center">
            Woche vom {new Date(weekStart + 'T00:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost px-3 py-2 text-lg">›</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="btn-secondary text-xs px-3 py-1.5">Heute</button>
          )}
          {days.length > 0 && (() => {
            const lines = days.map((day: any) => {
              const d = new Date(day.date + 'T00:00:00Z').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
              const meals = [
                day.breakfast && `☀️ ${day.breakfast.title}`,
                day.lunch && `🥗 ${day.lunch.title}`,
                day.dinner && `🍽️ ${day.dinner.title}`,
                ...(day.snacks || []).map((s: any) => `🍎 ${s.title}`),
              ].filter(Boolean).join('\n  ');
              return meals ? `${d}:\n  ${meals}` : null;
            }).filter(Boolean).join('\n\n');
            return <ShareMenu text={`Mein Mahlzeitenplan 🍽️\n\n${lines}`} title="Mahlzeitenplan" />;
          })()}
        </div>
      </div>

      {/* Auto plan button */}
      {mealPlan && (
        <div className="mb-4">
          <button
            onClick={() => setShowAutoModal(true)}
            disabled={autoPlanning}
            className="btn-secondary text-sm w-full"
          >
            {autoPlanning ? 'Wird geplant...' : '✨ Woche automatisch planen'}
          </button>
        </div>
      )}

      {/* Auto plan modal */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAutoModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-xl text-charcoal mb-2">✨ Woche planen</h3>
            <p className="text-sm text-charcoal-light mb-4">Welche Mahlzeiten soll ich für dich planen?</p>

            <div className="space-y-3 mb-6">
              {([['breakfast', '☀️ Frühstück'], ['lunch', '🥗 Mittagessen'], ['dinner', '🍽️ Abendessen']] as const).map(([slot, label]) => (
                <label key={slot} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSlots[slot]}
                    onChange={e => setAutoSlots(prev => ({ ...prev, [slot]: e.target.checked }))}
                    className="w-5 h-5 rounded accent-regency"
                  />
                  <span className="text-sm text-charcoal">{label}</span>
                </label>
              ))}
            </div>

            {/* Calorie info */}
            <div className="bg-cream rounded-xl p-3 mb-4 text-xs text-charcoal-light">
              <p>Geplante Kalorien pro Tag:</p>
              <p className="font-bold text-charcoal text-sm mt-1">
                ca. {
                  (autoSlots.breakfast ? 400 : 0) +
                  (autoSlots.lunch ? 500 : 0) +
                  (autoSlots.dinner ? 550 : 0)
                } kcal
                <span className="font-normal text-charcoal-light"> ({[
                  autoSlots.breakfast && 'Frühstück ~400',
                  autoSlots.lunch && 'Mittag ~500',
                  autoSlots.dinner && 'Abend ~550',
                ].filter(Boolean).join(', ')} kcal)</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAutoModal(false)} className="btn-ghost flex-1">Abbrechen</button>
              <button
                onClick={async () => {
                  setShowAutoModal(false);
                  setAutoPlanning(true);
                  try {
                    const { recipes } = await api.recipes.list({ pageSize: 100 });
                    const byCategory: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [] };
                    for (const r of recipes) {
                      if (byCategory[r.category]) byCategory[r.category].push(r);
                    }
                    for (const cat of Object.keys(byCategory)) {
                      byCategory[cat].sort(() => Math.random() - 0.5);
                    }
                    for (let i = 0; i < days.length; i++) {
                      const day = days[i];
                      if (autoSlots.breakfast) {
                        const r = byCategory.breakfast[i % byCategory.breakfast.length];
                        if (r) await api.mealPlans.updateSlot(mealPlan.id, day.date, 'breakfast', r);
                      }
                      if (autoSlots.lunch) {
                        const r = byCategory.lunch[i % byCategory.lunch.length];
                        if (r) await api.mealPlans.updateSlot(mealPlan.id, day.date, 'lunch', r);
                      }
                      if (autoSlots.dinner) {
                        const r = byCategory.dinner[i % byCategory.dinner.length];
                        if (r) await api.mealPlans.updateSlot(mealPlan.id, day.date, 'dinner', r);
                      }
                    }
                    await loadPlan(weekOffset);
                  } catch { alert('Planung fehlgeschlagen.'); }
                  finally { setAutoPlanning(false); }
                }}
                disabled={!autoSlots.breakfast && !autoSlots.lunch && !autoSlots.dinner}
                className="btn-primary flex-1"
              >
                Planen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal inspiration */}
      <Link href="/saisonkalender" className="block mb-4">
        <div className="bg-pistachio-light rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-pistachio/30 transition-colors">
          <span className="text-sm">🍓</span>
          <span className="text-xs text-charcoal">
            <strong>Jetzt Saison:</strong> {(SEASONAL_HINTS[new Date().getMonth()] || []).join(' · ')}
          </span>
          <span className="text-xs text-charcoal-light ml-auto">→ Saisonkalender</span>
        </div>
      </Link>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Mobile: single day view */}
        {days.length > 0 && (
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveDayIndex(i => Math.max(0, i - 1))}
                disabled={activeDayIndex === 0}
                className="btn-ghost px-3 py-2 text-lg disabled:opacity-30"
                aria-label="Vorheriger Tag"
              >‹</button>
              <div className="text-center">
                <p className="text-xs font-semibold text-charcoal-500">{DAY_NAMES[activeDayIndex]}</p>
                <p className="text-2xl font-bold text-charcoal-700">
                  {new Date(days[activeDayIndex].date + 'T00:00:00Z').getUTCDate()}.
                  {new Date(days[activeDayIndex].date + 'T00:00:00Z').getUTCMonth() + 1}.
                </p>
              </div>
              <button
                onClick={() => setActiveDayIndex(i => Math.min(days.length - 1, i + 1))}
                disabled={activeDayIndex === days.length - 1}
                className="btn-ghost px-3 py-2 text-lg disabled:opacity-30"
                aria-label="Nächster Tag"
              >›</button>
            </div>
            <div className="space-y-2">
              {SLOTS.map(slot => {
                const day = days[activeDayIndex];
                const droppableId = `${day.date}-${slot}`;
                const recipe = slot === 'snacks' ? day.snacks?.[0] : day[slot];
                return (
                  <div key={slot} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-charcoal-500 w-24 shrink-0">{SLOT_LABELS[slot]}</span>
                    <div className="flex-1">
                      <MealSlot
                        id={droppableId}
                        date={day.date}
                        slot={slot}
                        recipe={recipe}
                        onClear={() => handleClear(day.date, slot)}
                        onPick={() => setPicker({ date: day.date, slot })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <DayTotalsBar totals={days[activeDayIndex]} />
            </div>
          </div>
        )}

        {/* Desktop: full week grid */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div />
              {days.map((day, i) => {
                const isToday = day.date === new Date().toISOString().slice(0, 10);
                return (
                  <div key={day.date} className="text-center">
                    <p className={`text-xs font-semibold ${isToday ? 'text-regency-dark' : 'text-charcoal-500'}`}>
                      {DAY_NAMES[i]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-regency-dark' : 'text-charcoal-700'}`}>
                      {new Date(day.date + 'T00:00:00Z').getUTCDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Meal rows */}
            {SLOTS.map(slot => (
              <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-charcoal-500 leading-tight">{SLOT_LABELS[slot]}</span>
                </div>
                {days.map(day => {
                  const droppableId = `${day.date}-${slot}`;
                  const recipe = slot === 'snacks' ? day.snacks?.[0] : day[slot];
                  return (
                    <MealSlot
                      key={droppableId}
                      id={droppableId}
                      date={day.date}
                      slot={slot}
                      recipe={recipe}
                      onClear={() => handleClear(day.date, slot)}
                      onPick={() => setPicker({ date: day.date, slot })}
                    />
                  );
                })}
              </div>
            ))}

            {/* Day totals row */}
            <div className="grid grid-cols-8 gap-2 mt-1">
              <div className="text-xs font-semibold text-charcoal-400 self-start pt-1">Gesamt</div>
              {days.map(day => (
                <DayTotalsBar key={day.date} totals={day} />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeRecipe && (
            <div className="bg-white border-2 border-regency rounded-xl p-2 shadow-xl text-xs font-semibold text-charcoal-800 max-w-[120px] truncate">
              {activeRecipe.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Week totals */}
      {days.length > 0 && <WeekTotalsPanel days={days} />}

      {/* Generate shopping list */}
      {mealPlan?.id && (
        <div className="text-center mt-6">
          <button
            onClick={async () => {
              try {
                await api.shoppingList.generate(mealPlan.id);
                alert('Einkaufsliste wurde erstellt! Du findest sie unter Einkaufsliste.');
              } catch {
                alert('Einkaufsliste konnte nicht erstellt werden.');
              }
            }}
            className="btn-primary"
          >
            🛒 Einkaufsliste aus diesem Plan erstellen
          </button>
        </div>
      )}

      {/* Recipe picker modal */}
      {picker && (
        <RecipePickerModal
          slot={picker.slot}
          onSelect={recipe => {
            handleAssign(picker.date, picker.slot, recipe);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
