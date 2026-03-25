'use client';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RecipeCard } from '@/components/RecipeCard';
import { api } from '@/lib/api';

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'high-protein'];
const DIETARY_LABELS: Record<string, string> = {
  'vegan': 'vegan', 'vegetarian': 'vegetarisch', 'gluten-free': 'glutenfrei',
  'dairy-free': 'laktosefrei', 'nut-free': 'nussfrei', 'low-carb': 'kohlenhydratarm', 'high-protein': 'proteinreich',
};

const CLOTHING_SIZES = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'];
const HAIR_COLORS = ['Blond', 'Dunkelblond', 'Braun', 'Dunkelbraun', 'Schwarz', 'Rot', 'Grau', 'Weiss', 'Gefärbt'];
const EYE_COLORS = ['Blau', 'Grün', 'Braun', 'Grau', 'Haselnuss', 'Bernstein'];
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Wenig aktiv (Büroarbeit)' },
  { value: 'light', label: 'Leicht aktiv (1-2x Sport/Woche)' },
  { value: 'moderate', label: 'Mässig aktiv (3-5x Sport/Woche)' },
  { value: 'active', label: 'Sehr aktiv (täglicher Sport)' },
  { value: 'very_active', label: 'Extrem aktiv (Leistungssport)' },
];

function calculateBMI(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi === 0) return { label: '', color: '' };
  if (bmi < 18.5) return { label: 'Untergewicht', color: 'text-regency' };
  if (bmi < 25) return { label: 'Normalgewicht', color: 'text-pistachio-dark' };
  if (bmi < 30) return { label: 'Übergewicht', color: 'text-rose-dark' };
  return { label: 'Adipositas', color: 'text-red-500' };
}

function calculateDailyCalories(
  weightKg: number, heightCm: number, birthYear: number, activityLevel: string
): number {
  if (!weightKg || !heightCm || !birthYear) return 0;
  const age = new Date().getFullYear() - birthYear;
  // Mifflin-St Jeor for women
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const factors: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  return Math.round(bmr * (factors[activityLevel] || 1.375));
}

export default function ProfilePage() {
  return <ProtectedRoute><Profile /></ProtectedRoute>;
}

function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [activityLevel, setActivityLevel] = useState('light');
  const [clothingSize, setClothingSize] = useState('');
  const [shoeSize, setShoeSize] = useState<number | ''>('');
  const [hairColor, setHairColor] = useState('');
  const [waistCm, setWaistCm] = useState<number | ''>('');
  const [bustCm, setBustCm] = useState<number | ''>('');
  const [eyeColor, setEyeColor] = useState('');
  const [bodyLikes, setBodyLikes] = useState('');
  const [bodyDiscreet, setBodyDiscreet] = useState('');

  useEffect(() => {
    api.users.me().then(d => {
      const u = d.user;
      setProfile(u);
      setDisplayName(u.displayName || '');
      setDietary(u.dietaryPreferences || []);
      setBirthYear(u.birthYear || '');
      setHeightCm(u.heightCm || '');
      setWeightKg(u.weightKg || '');
      setActivityLevel(u.activityLevel || 'light');
      setClothingSize(u.clothingSize || '');
      setShoeSize(u.shoeSize || '');
      setHairColor(u.hairColor || '');
      setWaistCm(u.waistCm || '');
      setBustCm(u.bustCm || '');
      setEyeColor(u.eyeColor || '');
      setBodyLikes(u.bodyLikes || '');
      setBodyDiscreet(u.bodyDiscreet || '');
      const ids: string[] = u.savedRecipeIds || [];
      Promise.all(ids.map((id: string) => api.recipes.get(id).then(r => r.recipe).catch(() => null)))
        .then(results => setSavedRecipes(results.filter(Boolean)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const bmi = calculateBMI(Number(heightCm) || 0, Number(weightKg) || 0);
  const bmiInfo = getBMICategory(bmi);
  const dailyCal = calculateDailyCalories(
    Number(weightKg) || 0, Number(heightCm) || 0, Number(birthYear) || 0, activityLevel
  );

  function toggleDietary(pref: string) {
    setDietary(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Record<string, any> = {
        displayName, dietaryPreferences: dietary, activityLevel,
        clothingSize, hairColor, eyeColor, bodyLikes, bodyDiscreet,
      };
      if (birthYear) data.birthYear = Number(birthYear);
      if (heightCm) data.heightCm = Number(heightCm);
      if (weightKg) data.weightKg = Number(weightKg);
      if (shoeSize) data.shoeSize = Number(shoeSize);
      if (waistCm) data.waistCm = Number(waistCm);
      if (bustCm) data.bustCm = Number(bustCm);

      const { user } = await api.users.update(data);
      setProfile(user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  async function handleAvatarUploaded(url: string) {
    await api.users.update({ avatarUrl: url });
    setProfile((p: any) => ({ ...p, avatarUrl: url }));
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center text-charcoal-light">Profil wird geladen…</div>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-8">Mein Profil</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar & Name */}
        <div className="card p-6">
          <div className="flex items-center gap-6 mb-6">
            <AvatarUpload current={profile?.avatarUrl} onUploaded={handleAvatarUploaded} />
            <div>
              <p className="font-semibold text-charcoal">{profile?.displayName || 'Anonym'}</p>
              <p className="text-sm text-charcoal-light">{profile?.email}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Anzeigename</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="input-field" placeholder="Dein Name" />
          </div>
        </div>

        {/* Body & Health */}
        <div className="card p-6">
          <h2 className="font-heading text-xl text-charcoal mb-4">Körper & Gesundheit</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Geburtsjahr</label>
              <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value ? Number(e.target.value) : '')}
                className="input-field" placeholder="z.B. 1985" min="1930" max="2020" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Grösse (cm)</label>
              <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                className="input-field" placeholder="z.B. 168" min="100" max="250" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Gewicht (kg)</label>
              <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                className="input-field" placeholder="z.B. 65" min="30" max="300" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Aktivitätslevel</label>
              <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)} className="input-field">
                {ACTIVITY_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Taillenumfang (cm)</label>
              <input type="number" value={waistCm} onChange={e => setWaistCm(e.target.value ? Number(e.target.value) : '')}
                className="input-field" placeholder="optional" min="40" max="200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Brustumfang (cm)</label>
              <input type="number" value={bustCm} onChange={e => setBustCm(e.target.value ? Number(e.target.value) : '')}
                className="input-field" placeholder="optional" min="50" max="200" />
            </div>
          </div>

          {/* BMI & Daily Calories */}
          {(bmi > 0 || dailyCal > 0) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {bmi > 0 && (
                <div className="bg-cream rounded-xl p-4 text-center">
                  <p className="text-xs text-charcoal-light mb-1">BMI</p>
                  <p className="text-2xl font-bold text-regency">{bmi}</p>
                  <p className={`text-xs font-medium mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</p>
                </div>
              )}
              {dailyCal > 0 && (
                <div className="bg-cream rounded-xl p-4 text-center">
                  <p className="text-xs text-charcoal-light mb-1">Täglicher Kalorienbedarf</p>
                  <p className="text-2xl font-bold text-regency">{dailyCal}</p>
                  <p className="text-xs text-charcoal-light mt-1">kcal / Tag</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Style & Fashion */}
        <div className="card p-6">
          <h2 className="font-heading text-xl text-charcoal mb-4">Stil & Mode</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Kleidergrösse</label>
              <select value={clothingSize} onChange={e => setClothingSize(e.target.value)} className="input-field">
                <option value="">— wählen —</option>
                {CLOTHING_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Schuhgrösse</label>
              <input type="number" value={shoeSize} onChange={e => setShoeSize(e.target.value ? Number(e.target.value) : '')}
                className="input-field" placeholder="z.B. 38" min="34" max="45" step="0.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Haarfarbe</label>
              <select value={hairColor} onChange={e => setHairColor(e.target.value)} className="input-field">
                <option value="">— wählen —</option>
                {HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Augenfarbe</label>
              <select value={eyeColor} onChange={e => setEyeColor(e.target.value)} className="input-field">
                <option value="">— wählen —</option>
                {EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                💝 Das mag ich an mir und möchte es betonen
              </label>
              <textarea
                value={bodyLikes}
                onChange={e => setBodyLikes(e.target.value)}
                className="input-field resize-none text-sm"
                rows={2}
                placeholder="z.B. meine Schultern, meine Taille, meine langen Beine..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                🤫 Das möchte ich lieber kaschieren
              </label>
              <textarea
                value={bodyDiscreet}
                onChange={e => setBodyDiscreet(e.target.value)}
                className="input-field resize-none text-sm"
                rows={2}
                placeholder="z.B. meine Oberarme, mein Bauch, meine Oberschenkel..."
              />
            </div>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="card p-6">
          <h2 className="font-heading text-xl text-charcoal mb-4">Ernährungsweise</h2>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(pref => (
              <button key={pref} type="button" onClick={() => toggleDietary(pref)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  dietary.includes(pref)
                    ? 'bg-pistachio border-pistachio text-white'
                    : 'bg-white border-charcoal-light text-charcoal hover:border-pistachio'
                }`}
              >
                {DIETARY_LABELS[pref] ?? pref}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? 'Speichern…' : saved ? '✓ Gespeichert!' : 'Profil speichern'}
        </button>
      </form>

      {/* Saved recipes */}
      <section className="mt-10">
        <h2 className="font-heading text-2xl text-charcoal mb-4">Gespeicherte Rezepte ({savedRecipes.length})</h2>
        {savedRecipes.length === 0 ? (
          <div className="card p-8 text-center text-charcoal-light">
            <p className="text-4xl mb-3">🔖</p>
            <p>Noch keine gespeicherten Rezepte. Markiere ein Rezept mit einem Herz, um es hier zu speichern.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        )}
      </section>
    </main>
  );
}
