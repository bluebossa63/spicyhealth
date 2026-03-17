'use client';
import { useEffect, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel, Filters } from '@/components/FilterPanel';
import { RecipeCard } from '@/components/RecipeCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { api } from '@/lib/api';

const DEFAULT_FILTERS: Filters = { category: '', maxCalories: 1500, maxPrepTime: 120, maxCost: 30 };

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    fetchRecipes(1, true);
  }, [search, filters]);

  async function fetchRecipes(p: number, reset = false) {
    setLoading(true);
    try {
      const params: any = { page: p, pageSize: 12 };
      if (search) params.search = search;
      if (filters.category) params.category = filters.category;
      if (filters.maxCalories < 1500) params.maxCalories = filters.maxCalories;
      if (filters.maxPrepTime < 120) params.maxPrepTime = filters.maxPrepTime;
      if (filters.maxCost < 30) params.maxCost = filters.maxCost;

      const { recipes: data } = await api.recipes.list(params);
      setRecipes(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 12);
    } catch {
      // API not available — show empty state
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchRecipes(next);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-charcoal mb-2">Recipes</h1>
        <p className="text-charcoal-light">Discover healthy, delicious meals</p>
      </div>

      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <FilterPanel filters={filters} onChange={f => setFilters(f)} />
        </aside>

        {/* Recipe grid */}
        <div className="flex-1">
          {loading && recipes.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🥗</div>
              <h3 className="font-heading text-xl text-charcoal mb-2">No recipes found</h3>
              <p className="text-charcoal-light text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {recipes.map(r => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    saved={savedIds.has(r.id)}
                    onSaveToggle={id => setSavedIds(prev => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    })}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <button onClick={loadMore} className="btn-secondary" disabled={loading}>
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
