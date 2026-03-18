'use client';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RecipeCard } from '@/components/RecipeCard';
import { api } from '@/lib/api';

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'high-protein'];

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.users.me().then(d => {
      setProfile(d.user);
      setDisplayName(d.user.displayName || '');
      setDietary(d.user.dietaryPreferences || []);
      // Fetch saved recipes
      const ids: string[] = d.user.savedRecipeIds || [];
      Promise.all(ids.map(id => api.recipes.get(id).then(r => r.recipe).catch(() => null)))
        .then(results => setSavedRecipes(results.filter(Boolean)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function toggleDietary(pref: string) {
    setDietary(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { user } = await api.users.update({ displayName, dietaryPreferences: dietary });
      setProfile(user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUploaded(url: string) {
    await api.users.update({ avatarUrl: url });
    setProfile((p: any) => ({ ...p, avatarUrl: url }));
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center text-charcoal-400">Loading profile…</div>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl text-charcoal-800 mb-8">My Profile</h1>

      <form onSubmit={handleSave} className="card p-6 mb-8 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <AvatarUpload current={profile?.avatarUrl} onUploaded={handleAvatarUploaded} />
          <div>
            <p className="font-semibold text-charcoal-800">{profile?.displayName || 'Anonymous'}</p>
            <p className="text-sm text-charcoal-400">{profile?.email}</p>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="input-field"
            placeholder="Your name"
          />
        </div>

        {/* Dietary preferences */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">Dietary preferences</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(pref => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleDietary(pref)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  dietary.includes(pref)
                    ? 'bg-sage-500 border-sage-500 text-white'
                    : 'bg-white border-charcoal-200 text-charcoal-600 hover:border-sage-400'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </form>

      {/* Saved recipes */}
      <section>
        <h2 className="font-display text-2xl text-charcoal-800 mb-4">Saved Recipes ({savedRecipes.length})</h2>
        {savedRecipes.length === 0 ? (
          <div className="card p-8 text-center text-charcoal-400">
            <p className="text-4xl mb-3">🔖</p>
            <p>No saved recipes yet. Heart a recipe to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
