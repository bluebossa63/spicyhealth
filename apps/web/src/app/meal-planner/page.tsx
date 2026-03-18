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

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
const SLOT_LABELS: Record<string, string> = {
  breakfast: '☀️ Breakfast',
  lunch: '🥗 Lunch',
  dinner: '🍽️ Dinner',
  snacks: '🍎 Snack',
};
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        <h1 className="font-display text-3xl text-charcoal-800">Meal Planner</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost px-3 py-2 text-lg">‹</button>
          <span className="text-sm text-charcoal-600 min-w-[120px] text-center">
            Week of {new Date(weekStart + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost px-3 py-2 text-lg">›</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="btn-secondary text-xs px-3 py-1.5">Today</button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Grid: mobile = day-per-row, desktop = 7 columns */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div /> {/* slot label column */}
              {days.map((day, i) => {
                const isToday = day.date === new Date().toISOString().slice(0, 10);
                return (
                  <div key={day.date} className="text-center">
                    <p className={`text-xs font-semibold ${isToday ? 'text-terracotta-600' : 'text-charcoal-500'}`}>
                      {DAY_NAMES[i]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-terracotta-500' : 'text-charcoal-700'}`}>
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
              <div className="text-xs font-semibold text-charcoal-400 self-start pt-1">Totals</div>
              {days.map(day => (
                <DayTotalsBar key={day.date} totals={day} />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeRecipe && (
            <div className="bg-white border-2 border-terracotta-400 rounded-xl p-2 shadow-xl text-xs font-semibold text-charcoal-800 max-w-[120px] truncate">
              {activeRecipe.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Week totals */}
      {days.length > 0 && <WeekTotalsPanel days={days} />}

      {/* Recipe picker modal */}
      {picker && (
        <RecipePickerModal
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
