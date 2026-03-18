'use client';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { api as mealApi } from '@/lib/api';

type ShoppingCategory = 'produce' | 'dairy' | 'meat' | 'grains' | 'pantry' | 'frozen' | 'other';

const CATEGORY_META: Record<ShoppingCategory, { label: string; icon: string }> = {
  produce: { label: 'Produce', icon: '🥦' },
  dairy: { label: 'Dairy & Eggs', icon: '🥛' },
  meat: { label: 'Meat & Fish', icon: '🥩' },
  grains: { label: 'Grains & Bread', icon: '🌾' },
  pantry: { label: 'Pantry', icon: '🫙' },
  frozen: { label: 'Frozen', icon: '❄️' },
  other: { label: 'Other', icon: '🛒' },
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
        <h1 className="font-display text-3xl text-charcoal-800">Shopping List</h1>
        <div className="flex flex-wrap gap-2">
          {mealPlan && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? 'Generating…' : '✨ Generate from plan'}
            </button>
          )}
          {items.length > 0 && (
            <>
              <button onClick={handleCopyToClipboard} className="btn-secondary text-sm">📋 Copy</button>
              {purchasedCount > 0 && (
                <button onClick={handleClearPurchased} className="btn-ghost text-sm text-red-500">
                  🗑 Clear done ({purchasedCount})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Totals bar */}
      {items.length > 0 && (
        <div className="card p-4 mb-6 flex flex-wrap gap-6 text-sm">
          <span className="text-charcoal-600">
            <strong className="text-charcoal-800">{purchasedCount}/{totalItems}</strong> items done
          </span>
          <span className="text-charcoal-600">
            <strong className="text-charcoal-800">€{totalCost.toFixed(2)}</strong> est. total
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
          <p className="text-charcoal-600 font-semibold mb-1">Your shopping list is empty</p>
          {mealPlan
            ? <p className="text-charcoal-400 text-sm">Generate it from your current meal plan, or add items manually below.</p>
            : <p className="text-charcoal-400 text-sm">Plan some meals first, then generate your list automatically.</p>
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
                <button onClick={() => setAddingTo(cat)} className="text-xs text-sage-500 hover:text-sage-700">+ Add</button>
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
                  {isAdding ? 'Cancel' : '+ Add'}
                </button>
              </div>

              <ul>
                {group.map((item, i) => (
                  <li key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < group.length - 1 ? 'border-b border-cream-50' : ''}`}>
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
                      <span className="text-xs text-charcoal-400 shrink-0">€{item.estimatedCostEur.toFixed(2)}</span>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-charcoal-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              {isAdding && (
                <div className="px-4 py-3 border-t border-cream-100 flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem(cat)}
                    placeholder="Item name…"
                    className="input-field flex-1 text-sm"
                    autoFocus
                  />
                  <button onClick={() => handleAddItem(cat)} className="btn-primary text-sm px-4">Add</button>
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
            placeholder="Add an item to your list…"
            className="input-field flex-1"
          />
          <button onClick={() => handleAddItem('other')} disabled={!newItemName.trim()} className="btn-secondary">
            Add
          </button>
        </div>
      )}
    </main>
  );
}
