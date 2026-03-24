'use client';
import { useEffect, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { api as mealApi } from '@/lib/api';

type ShoppingCategory = 'produce' | 'dairy' | 'meat' | 'grains' | 'pantry' | 'frozen' | 'other';

const CATEGORY_META: Record<ShoppingCategory, { label: string; icon: string }> = {
  produce: { label: 'Obst & Gemüse', icon: '🥦' },
  dairy: { label: 'Milchprodukte & Eier', icon: '🥛' },
  meat: { label: 'Fleisch & Fisch', icon: '🥩' },
  grains: { label: 'Getreide & Brot', icon: '🌾' },
  pantry: { label: 'Vorratskammer', icon: '🫙' },
  frozen: { label: 'Tiefkühlprodukte', icon: '❄️' },
  other: { label: 'Sonstiges', icon: '🛒' },
};

const CATEGORY_ORDER: ShoppingCategory[] = ['produce', 'dairy', 'meat', 'grains', 'pantry', 'frozen', 'other'];

export default function ShoppingListPage() {
  return (
    <ProtectedRoute>
      <ShoppingList />
    </ProtectedRoute>
  );
}

function ShoppingList() {
  const [items, setItems] = useState<any[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [newItemName, setNewItemName] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent, id: string) {
    touchStartX.current = e.touches[0].clientX;
    setSwipingId(id);
    setSwipeX(0);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    setSwipeX(Math.min(0, dx));
  }

  function onTouchEnd(id: string) {
    if (swipeX < -72) handleDelete(id);
    touchStartX.current = null;
    setSwipingId(null);
    setSwipeX(0);
  }

  useEffect(() => {
    Promise.all([
      api.shoppingList.get().then(d => { setItems(d.items); setListId(d.listId); }),
      api.mealPlans.current().then(d => setMealPlan(d.mealPlan)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    if (!mealPlan?.id) return;
    setGenerating(true);
    try {
      const { items: generated, listId: id } = await api.shoppingList.generate(mealPlan.id);
      setItems(generated);
      setListId(id);
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggle(id: string, purchased: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased } : i));
    try {
      await api.shoppingList.updateItem(id, { purchased });
    } catch {
      setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: !purchased } : i));
    }
  }

  async function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    try { await api.shoppingList.deleteItem(id); } catch { /* ignore */ }
  }

  async function handleAddItem(category: string) {
    const name = newItemName.trim();
    if (!name) return;
    try {
      const { item } = await api.shoppingList.addItem({ name });
      setItems(prev => [...prev, item]);
      setNewItemName('');
      setAddingTo(null);
    } catch {}
  }

  async function handleClearPurchased() {
    const purchased = items.filter(i => i.purchased);
    setItems(prev => prev.filter(i => !i.purchased));
    await Promise.all(purchased.map(i => api.shoppingList.deleteItem(i.id).catch(() => {})));
  }

  async function handleClearAll() {
    if (!confirm(`Alle ${items.length} Artikel aus der Einkaufsliste löschen?`)) return;
    const allItems = [...items];
    setItems([]);
    await Promise.all(allItems.map(i => api.shoppingList.deleteItem(i.id).catch(() => {})));
  }

  function handleCopyToClipboard() {
    const lines = CATEGORY_ORDER.flatMap(cat => {
      const group = items.filter(i => i.category === cat);
      if (!group.length) return [];
      const header = `\n${CATEGORY_META[cat].icon} ${CATEGORY_META[cat].label}`;
      const rows = group.map(i => `  ${i.purchased ? '✓' : '○'} ${i.name} — ${i.quantity} ${i.unit}`.trim());
      return [header, ...rows];
    });
    navigator.clipboard.writeText(lines.join('\n').trim());
  }

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, any[]>);

  const totalItems = items.length;
  const purchasedCount = items.filter(i => i.purchased).length;
  const totalCost = items.reduce((s, i) => s + (i.estimatedCostEur || 0), 0);

  if (loading) return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-cream-200 rounded-lg w-48" />
        <div className="h-40 bg-cream-100 rounded-2xl" />
      </div>
    </main>
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-3xl text-charcoal-800">Einkaufsliste</h1>
        <div className="flex flex-wrap gap-2">
          {mealPlan && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? 'Wird generiert…' : '✨ Aus Mahlzeitenplan generieren'}
            </button>
          )}
          {items.length > 0 && (
            <>
              <button onClick={handleCopyToClipboard} className="btn-secondary text-sm">📋 Kopieren</button>
              <button onClick={() => {
                const lines = CATEGORY_ORDER.flatMap(cat => {
                  const group = items.filter(i => i.category === cat);
                  if (!group.length) return [];
                  const header = `${CATEGORY_META[cat].icon} ${CATEGORY_META[cat].label}`;
                  const rows = group.map(i => `  ${i.purchased ? '✓' : '○'} ${i.name} — ${i.quantity} ${i.unit}`.trim());
                  return [header, ...rows];
                });
                const text = `Meine Einkaufsliste 🛒\n\n${lines.join('\n')}`;
                if (navigator.share) {
                  navigator.share({ title: 'Einkaufsliste', text });
                } else {
                  navigator.clipboard.writeText(text);
                  alert('Liste kopiert! Du kannst sie jetzt teilen.');
                }
              }} className="btn-ghost text-sm">📤 Teilen</button>
              {purchasedCount > 0 && (
                <button onClick={handleClearPurchased} className="btn-ghost text-sm text-charcoal-light">
                  ✓ Erledigte entfernen ({purchasedCount})
                </button>
              )}
              <button onClick={handleClearAll} className="btn-ghost text-sm text-red-400 hover:text-red-600">
                🗑 Alle löschen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Totals bar */}
      {items.length > 0 && (
        <div className="card p-4 mb-6 flex flex-wrap gap-6 text-sm">
          <span className="text-charcoal-600">
            <strong className="text-charcoal-800">{purchasedCount}/{totalItems}</strong> Artikel erledigt
          </span>
          <span className="text-charcoal-600">
            <strong className="text-charcoal-800">CHF {totalCost.toFixed(2)}</strong> geschätzte Gesamtkosten
          </span>
          <div className="flex-1 flex items-center min-w-[120px]">
            <div className="w-full bg-cream-200 rounded-full h-2">
              <div
                className="bg-sage-400 h-2 rounded-full transition-all"
                style={{ width: totalItems > 0 ? `${(purchasedCount / totalItems) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card p-12 text-center mb-6">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-charcoal-600 font-semibold mb-1">Deine Einkaufsliste ist leer</p>
          {mealPlan
            ? <p className="text-charcoal-400 text-sm">Generiere sie aus deinem aktuellen Mahlzeitenplan oder füge Artikel manuell hinzu.</p>
            : <p className="text-charcoal-400 text-sm">Plane zuerst einige Mahlzeiten, dann wird deine Liste automatisch erstellt.</p>
          }
        </div>
      )}

      {/* Grouped items */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map(cat => {
          const group = grouped[cat];
          const meta = CATEGORY_META[cat];
          const isAdding = addingTo === cat;

          // Show all categories when list is non-empty (so user can add to any group)
          // Show only categories with items otherwise
          if (!isAdding && group.length === 0 && items.length > 0) {
            return (
              <div key={cat} className="flex items-center justify-between px-1">
                <span className="text-xs text-charcoal-400">{meta.icon} {meta.label}</span>
                <button onClick={() => setAddingTo(cat)} className="text-xs text-sage-500 hover:text-sage-700">+ Hinzufügen</button>
              </div>
            );
          }
          if (!isAdding && group.length === 0) return null;

          return (
            <div key={cat} className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <span className="font-semibold text-charcoal-700">{meta.label}</span>
                  <span className="text-xs bg-cream-100 text-charcoal-400 px-2 py-0.5 rounded-full">{group.length}</span>
                </div>
                <button onClick={() => setAddingTo(isAdding ? null : cat)} className="text-xs text-sage-500 hover:text-sage-700">
                  {isAdding ? 'Abbrechen' : '+ Hinzufügen'}
                </button>
              </div>

              <ul>
                {group.map((item, i) => {
                  const isSwiping = swipingId === item.id;
                  const translate = isSwiping ? swipeX : 0;
                  return (
                  <li
                    key={item.id}
                    className={`relative overflow-hidden ${i < group.length - 1 ? 'border-b border-cream-50' : ''}`}
                    onTouchStart={e => onTouchStart(e, item.id)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(item.id)}
                  >
                    {/* Swipe-reveal delete background */}
                    <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-400 w-20">
                      <span className="text-white text-sm font-semibold">Löschen</span>
                    </div>
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-white transition-transform"
                      style={{ transform: `translateX(${translate}px)` }}
                    >
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={e => handleToggle(item.id, e.target.checked)}
                        className="w-5 h-5 rounded accent-sage-500 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${item.purchased ? 'line-through text-charcoal-400' : 'text-charcoal-800'}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-charcoal-400 ml-2">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.estimatedCostEur > 0 && (
                        <span className="text-xs text-charcoal-400 shrink-0">CHF {item.estimatedCostEur.toFixed(2)}</span>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-charcoal-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                        aria-label={`${item.name} löschen`}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>

              {isAdding && (
                <div className="px-4 py-3 border-t border-cream-100 flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem(cat)}
                    placeholder="Artikelname…"
                    className="input-field flex-1 text-sm"
                    autoFocus
                  />
                  <button onClick={() => handleAddItem(cat)} className="btn-primary text-sm px-4">Hinzufügen</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global add item */}
      {!addingTo && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddItem('other')}
            placeholder="Artikel zur Liste hinzufügen…"
            className="input-field flex-1"
          />
          <button onClick={() => handleAddItem('other')} disabled={!newItemName.trim()} className="btn-secondary">
            Hinzufügen
          </button>
        </div>
      )}
    </main>
  );
}
