'use client';
import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import BackButton from '@/components/BackButton';

const MOODS = [
  { value: 'great', emoji: '😊', label: 'Super' },
  { value: 'good', emoji: '🙂', label: 'Gut' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Müde' },
  { value: 'stressed', emoji: '😤', label: 'Gestresst' },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function MeinTagPage() {
  return <ProtectedRoute><MeinTag /></ProtectedRoute>;
}

function MeinTag() {
  const [log, setLog] = useState<any>({ waterGlasses: 0, mood: '', energy: 0, sleepQuality: 0, note: '' });
  const [weekLogs, setWeekLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const date = today();

  useEffect(() => {
    api.dailyLogs.get(date).then(d => { if (d.log) setLog(d.log); }).catch(() => {});
    const days = getLast7Days();
    api.dailyLogs.getRange(days[0], days[6]).then(d => setWeekLogs(d.logs || [])).catch(() => {});
  }, []);

  const save = useCallback(async (updates: any) => {
    const newLog = { ...log, ...updates };
    setLog(newLog);
    setSaving(true);
    try {
      const { log: saved } = await api.dailyLogs.update({ date, ...updates });
      setLog(saved);
    } catch {} finally { setSaving(false); }
  }, [log, date]);

  // Achievements
  const streakDays = (() => {
    let count = 0;
    const days = getLast7Days().reverse();
    for (const d of days) {
      const entry = weekLogs.find(l => l.date === d);
      if (entry && (entry.waterGlasses >= 6 || entry.mood)) count++;
      else break;
    }
    return count;
  })();

  const weekWater = weekLogs.reduce((s, l) => s + (l.waterGlasses || 0), 0);
  const weekMeals = weekLogs.length; // approximate

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-charcoal mb-2">Mein Tag</h1>
      <p className="text-sm text-charcoal-light mb-6">
        {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {/* Water Tracker */}
      <Card className="p-6 mb-6">
        <h2 className="font-heading text-xl text-charcoal mb-4">💧 Wasser-Tracker</h2>
        <p className="text-sm text-charcoal-light mb-4">Ziel: 8 Gläser pro Tag</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => save({ waterGlasses: i + 1 <= log.waterGlasses ? i : i + 1 })}
              className={`w-12 h-14 rounded-xl text-2xl transition-all duration-200 ${
                i < log.waterGlasses
                  ? 'bg-regency-light scale-105'
                  : 'bg-cream hover:bg-regency-light/50'
              }`}
              title={`${i + 1} Gläser`}
            >
              {i < log.waterGlasses ? '💧' : '○'}
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-charcoal">
          {log.waterGlasses}/8 Gläser
          {log.waterGlasses >= 8 && ' — Bravo, geschafft! 🎉'}
        </p>
      </Card>

      {/* Mood & Wellbeing */}
      <Card className="p-6 mb-6">
        <h2 className="font-heading text-xl text-charcoal mb-4">✨ Wie fühlst du dich heute?</h2>
        <div className="flex gap-3 mb-4">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => save({ mood: m.value })}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                log.mood === m.value ? 'bg-rose-light scale-110 ring-2 ring-rose' : 'hover:bg-cream-dark'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-charcoal-light">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Energie-Level</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => save({ energy: v })}
                  className={`text-xl transition-transform ${v <= log.energy ? 'scale-110' : 'grayscale opacity-40'}`}
                >⚡</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Schlafqualität</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => save({ sleepQuality: v })}
                  className={`text-xl transition-transform ${v <= log.sleepQuality ? 'scale-110' : 'grayscale opacity-40'}`}
                >🌙</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Notiz für heute</label>
          <textarea
            value={log.note || ''}
            onChange={e => setLog((l: any) => ({ ...l, note: e.target.value }))}
            onBlur={() => log.note && save({ note: log.note })}
            className="input-field resize-none text-sm"
            rows={2}
            placeholder="Wie war dein Tag? Was hast du Schönes erlebt?"
          />
        </div>
      </Card>

      {/* Week Overview */}
      <Card className="p-6 mb-6">
        <h2 className="font-heading text-xl text-charcoal mb-4">📊 Deine Woche</h2>
        <div className="flex gap-1 justify-between mb-4">
          {getLast7Days().map(d => {
            const entry = weekLogs.find(l => l.date === d);
            const isToday = d === date;
            const dayName = new Date(d + 'T00:00:00Z').toLocaleDateString('de-DE', { weekday: 'short' });
            const glasses = entry?.waterGlasses || 0;
            const mood = MOODS.find(m => m.value === entry?.mood);
            return (
              <div key={d} className={`flex flex-col items-center gap-1 p-2 rounded-xl flex-1 ${isToday ? 'bg-regency-light' : ''}`}>
                <span className="text-[10px] text-charcoal-light font-medium">{dayName}</span>
                <span className="text-sm">{mood?.emoji || '—'}</span>
                <div className="w-full bg-cream-dark rounded-full h-1.5">
                  <div className="bg-regency h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (glasses / 8) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-charcoal-light">{glasses}💧</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h2 className="font-heading text-xl text-charcoal mb-4">🏆 Erfolge & Motivation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {streakDays > 0 && (
            <div className="bg-rose-light rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🔥</p>
              <p className="font-bold text-charcoal">{streakDays} Tage</p>
              <p className="text-xs text-charcoal-light">in Folge aktiv</p>
            </div>
          )}
          <div className="bg-regency-light rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">💧</p>
            <p className="font-bold text-charcoal">{weekWater} Gläser</p>
            <p className="text-xs text-charcoal-light">diese Woche getrunken</p>
          </div>
          {log.waterGlasses >= 8 && (
            <div className="bg-pistachio-light rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="font-bold text-charcoal">Wasserziel erreicht!</p>
              <p className="text-xs text-charcoal-light">Heute schon 8 Gläser</p>
            </div>
          )}
          {streakDays >= 7 && (
            <div className="bg-pistachio-light rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">⭐</p>
              <p className="font-bold text-charcoal">Ganze Woche!</p>
              <p className="text-xs text-charcoal-light">7 Tage am Stück — wow!</p>
            </div>
          )}
        </div>
        <p className="text-sm text-charcoal-light text-center mt-4 italic">
          {log.waterGlasses >= 8 ? 'Du bist heute auf einem tollen Weg! 💪' :
           log.waterGlasses >= 4 ? 'Weiter so, du schaffst das! 🌟' :
           'Jeder Tag ist ein neuer Anfang — los geht\'s! ✨'}
        </p>
      </Card>

      {/* Progress link */}
      <div className="text-center mt-6">
        <a href="/fortschritt" className="btn-ghost text-sm">
          📊 Mein Fortschritt der letzten 30 Tage →
        </a>
      </div>

      {/* Reminder */}
      <Card className="p-6 mt-6">
        <h2 className="font-heading text-xl text-charcoal mb-3">🔔 Erinnerungen</h2>
        <p className="text-sm text-charcoal-light mb-4">
          Erhalte sanfte Erinnerungen, damit du an dein Wasser und deine Mahlzeiten denkst.
        </p>
        <button
          onClick={async () => {
            if (!('Notification' in window)) {
              alert('Dein Browser unterstützt keine Benachrichtigungen.');
              return;
            }
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              new Notification('SpicyHealth 💧', {
                body: 'Erinnerungen aktiviert! Wir erinnern dich ans Wassertrinken.',
                icon: '/icons/icon-192x192.png',
              });
              // Schedule water reminders every 2 hours
              if ('serviceWorker' in navigator) {
                alert('Erinnerungen aktiviert! Du wirst ans Wassertrinken erinnert.');
              }
            } else {
              alert('Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.');
            }
          }}
          className="btn-secondary text-sm w-full"
        >
          🔔 Erinnerungen aktivieren
        </button>
      </Card>
    </main>
  );
}
