'use client';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

const MOODS: Record<string, { emoji: string; label: string }> = {
  great: { emoji: '😊', label: 'Super' },
  good: { emoji: '🙂', label: 'Gut' },
  okay: { emoji: '😐', label: 'Geht so' },
  tired: { emoji: '😴', label: 'Müde' },
  stressed: { emoji: '😤', label: 'Gestresst' },
};

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function FortschrittPage() {
  return <ProtectedRoute><Fortschritt /></ProtectedRoute>;
}

function Fortschritt() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const days = getLast30Days();

  useEffect(() => {
    Promise.all([
      api.dailyLogs.getRange(days[0], days[days.length - 1]).then(d => setLogs(d.logs || [])),
      api.users.me().then(d => setProfile(d.user)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Stats
  const totalWater = logs.reduce((s, l) => s + (l.waterGlasses || 0), 0);
  const activeDays = logs.filter(l => l.waterGlasses > 0 || l.mood).length;
  const avgWater = activeDays > 0 ? Math.round(totalWater / activeDays * 10) / 10 : 0;
  const waterGoalDays = logs.filter(l => l.waterGlasses >= 8).length;

  const moodCounts: Record<string, number> = {};
  for (const l of logs) { if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; }
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const avgEnergy = (() => {
    const vals = logs.filter(l => l.energy > 0).map(l => l.energy);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : 0;
  })();

  const avgSleep = (() => {
    const vals = logs.filter(l => l.sleepQuality > 0).map(l => l.sleepQuality);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : 0;
  })();

  // Current streak
  const streak = (() => {
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const entry = logs.find(l => l.date === days[i]);
      if (entry && (entry.waterGlasses > 0 || entry.mood)) count++;
      else break;
    }
    return count;
  })();

  if (loading) return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-charcoal-light animate-pulse">Daten werden geladen...</p>
    </main>
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-2">📊 Mein Fortschritt</h1>
      <p className="text-sm text-charcoal-light mb-6">Deine letzten 30 Tage auf einen Blick</p>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-regency">{streak}</p>
          <p className="text-xs text-charcoal-light">Tage in Folge 🔥</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-regency">{avgWater}</p>
          <p className="text-xs text-charcoal-light">Ø Gläser/Tag 💧</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-regency">{waterGoalDays}</p>
          <p className="text-xs text-charcoal-light">Tage Ziel erreicht 🎯</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-regency">{activeDays}</p>
          <p className="text-xs text-charcoal-light">Aktive Tage 📅</p>
        </Card>
      </div>

      {/* Water chart — last 30 days */}
      <Card className="p-5 mb-6">
        <h2 className="font-heading text-lg text-charcoal mb-3">💧 Wasser — letzte 30 Tage</h2>
        <div className="flex items-end gap-0.5 h-24">
          {days.map(d => {
            const entry = logs.find(l => l.date === d);
            const glasses = entry?.waterGlasses || 0;
            const height = Math.min(100, (glasses / 8) * 100);
            const isToday = d === days[days.length - 1];
            return (
              <div key={d} className="flex-1 flex flex-col items-center justify-end h-full" title={`${new Date(d + 'T00:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}: ${glasses} Gläser`}>
                <div
                  className={`w-full rounded-t transition-all ${glasses >= 8 ? 'bg-regency' : glasses > 0 ? 'bg-regency-light' : 'bg-cream-dark'} ${isToday ? 'ring-1 ring-regency' : ''}`}
                  style={{ height: `${Math.max(4, height)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-charcoal-light mt-1">
          <span>{new Date(days[0] + 'T00:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
          <span>Heute</span>
        </div>
      </Card>

      {/* Mood & Energy */}
      <Card className="p-5 mb-6">
        <h2 className="font-heading text-lg text-charcoal mb-3">✨ Wohlbefinden</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-charcoal-light mb-1">Häufigste Stimmung</p>
            {topMood ? (
              <>
                <p className="text-3xl">{MOODS[topMood[0]]?.emoji || '—'}</p>
                <p className="text-xs text-charcoal font-medium">{MOODS[topMood[0]]?.label}</p>
              </>
            ) : <p className="text-charcoal-light">—</p>}
          </div>
          <div className="text-center">
            <p className="text-xs text-charcoal-light mb-1">Ø Energie</p>
            <p className="text-3xl">⚡</p>
            <p className="text-xs text-charcoal font-medium">{avgEnergy}/5</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-charcoal-light mb-1">Ø Schlaf</p>
            <p className="text-3xl">🌙</p>
            <p className="text-xs text-charcoal font-medium">{avgSleep}/5</p>
          </div>
        </div>
      </Card>

      {/* Mood timeline */}
      <Card className="p-5 mb-6">
        <h2 className="font-heading text-lg text-charcoal mb-3">Stimmungsverlauf</h2>
        <div className="flex gap-0.5">
          {days.map(d => {
            const entry = logs.find(l => l.date === d);
            const mood = entry?.mood;
            return (
              <div key={d} className="flex-1 text-center" title={new Date(d + 'T00:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}>
                <span className="text-xs">{mood ? MOODS[mood]?.emoji || '·' : '·'}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-charcoal-light mt-1">
          <span>Vor 30 Tagen</span>
          <span>Heute</span>
        </div>
      </Card>

      {/* Motivational message */}
      <Card className="p-5 text-center">
        <p className="text-lg mb-2">
          {streak >= 14 ? '🏆' : streak >= 7 ? '⭐' : streak >= 3 ? '🌟' : '💪'}
        </p>
        <p className="text-sm text-charcoal font-medium">
          {streak >= 14 ? 'Unglaublich! Über 2 Wochen am Stück — du bist ein Vorbild!' :
           streak >= 7 ? 'Eine ganze Woche! Du hast einen tollen Rhythmus gefunden.' :
           streak >= 3 ? 'Toll, du baust gute Gewohnheiten auf!' :
           'Jeder Tag zählt — fang heute an und bleib dran!'}
        </p>
      </Card>
    </main>
  );
}
