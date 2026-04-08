'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

// ─── Greeting helper ─────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function todayLabel() {
  return new Date().toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Dashboard (logged-in) ───────────────────────────────────────────────────

function DashboardView() {
  const { user } = useAuth();
  const [log, setLog] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.dailyLogs.get(today)
      .then(r => setLog(r.log ?? { date: today, waterGlasses: 0 }))
      .catch(() => setLog({ date: today, waterGlasses: 0 }));
    api.mealPlans.current()
      .then(r => setMealPlan(r.mealPlan))
      .catch(() => {});
  }, [today]);

  const waterCount: number = log?.waterGlasses ?? 0;
  const todayMeal = mealPlan?.days?.find((d: any) => d.date === today);
  const firstName = user?.displayName?.split(' ')[0] || 'du';

  const addWater = async () => {
    if (waterCount >= 8 || adding) return;
    setAdding(true);
    try {
      const r = await api.dailyLogs.update({ date: today, waterGlasses: waterCount + 1 });
      setLog(r.log);
    } finally {
      setAdding(false);
    }
  };

  const MEAL_SLOTS = [
    { key: 'breakfast', label: '☀️ Frühstück' },
    { key: 'lunch',     label: '🌿 Mittagessen' },
    { key: 'dinner',    label: '🌙 Abendessen' },
  ] as const;

  const QUICK_LINKS = [
    { href: '/recipes',     icon: '🥗', label: 'Rezepte' },
    { href: '/umstyling',   icon: '👗', label: 'Stilberaterin' },
    { href: '/mein-tag',    icon: '✨', label: 'Mein Tag' },
    { href: '/meal-planner',icon: '📅', label: 'Wochenplan' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

      {/* Greeting */}
      <div className="mb-2">
        <h1 className="font-heading text-3xl font-bold text-charcoal">
          {getGreeting()}, {firstName} 🌸
        </h1>
        <p className="text-charcoal-light mt-1 capitalize">{todayLabel()}</p>
      </div>

      {/* Water tracker */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-heading text-base font-semibold text-charcoal mb-2">💧 Wasser heute</h2>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="text-xl leading-none">
                  {i < waterCount ? '💧' : '○'}
                </span>
              ))}
            </div>
            <p className="text-xs text-charcoal-light mt-1">{waterCount} von 8 Gläsern</p>
          </div>
          <button
            onClick={addWater}
            disabled={waterCount >= 8 || adding}
            className="shrink-0 bg-regency text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-regency-dark transition-colors disabled:opacity-40"
          >
            + 1 Glas
          </button>
        </div>
      </Card>

      {/* Today's meal plan */}
      <Card className="p-5">
        <h2 className="font-heading text-base font-semibold text-charcoal mb-3">🍽️ Heute auf dem Plan</h2>
        <div className="space-y-0 divide-y divide-cream-dark">
          {MEAL_SLOTS.map(({ key, label }) => {
            const recipe = todayMeal?.[key];
            return (
              <div key={key} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-charcoal-light w-32">{label}</span>
                {recipe ? (
                  <span className="text-sm font-medium text-charcoal text-right">{recipe.title}</span>
                ) : (
                  <Link href="/meal-planner" className="text-sm text-regency hover:underline">
                    planen →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ href, icon, label }) => (
          <Link key={href} href={href}>
            <Card className="p-3 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-medium text-charcoal leading-tight">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Motivational footer */}
      <p className="text-center text-xs text-charcoal-light pt-2">
        Heute ist ein guter Tag für kleine Schritte. 💛
      </p>
    </div>
  );
}

// ─── Marketing page (not logged in) ─────────────────────────────────────────

const features = [
  { icon: '🥗', title: 'Rezeptbibliothek',    description: 'Leckere, gesunde Rezepte — einfach nachzukochen und für dich gemacht.',                           href: '/recipes' },
  { icon: '📅', title: 'Mahlzeitenplaner',     description: 'Plane deine Woche mit einem Klick — stressfrei und flexibel.',                                    href: '/meal-planner' },
  { icon: '🛒', title: 'Smarte Einkaufsliste', description: 'Automatisch aus deinem Plan — nie mehr vergessen, was du brauchst.',                              href: '/shopping-list' },
  { icon: '👗', title: 'Styling',              description: 'Deine persönliche Stilberaterin — entdecke was dir steht und was dich zum Strahlen bringt.',      href: '/umstyling' },
  { icon: '📸', title: 'Outfit-Galerie',       description: 'Dein persönliches Style-Board — sammle deine Lieblingsoutfits.',                                  href: '/outfit-galerie' },
  { icon: '✨', title: 'Mein Tag',             description: 'Dein Wasser-Tracker, Stimmungstagebuch und kleine Erfolge — alles auf einen Blick.',             href: '/mein-tag' },
  { icon: '🍓', title: 'Saisonkalender',       description: 'Was ist gerade frisch? Regional und saisonal einkaufen — ganz einfach.',                         href: '/saisonkalender' },
];

function MarketingPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-6">
          In 10 Minuten pro Tag<br />
          <span className="text-regency">zu mehr Energie und deinem Stil.</span>
        </h1>
        <p className="text-lg text-charcoal-light max-w-2xl mx-auto mb-4">
          Du hast wenig Zeit, willst dich aber gut fühlen? SpicyHealth plant deine Woche,
          inspiriert deinen Stil und macht gesundes Essen einfach — ohne Diätstress.
        </p>
        <p className="text-base text-charcoal-light max-w-xl mx-auto mb-10">
          Keine Vorschriften. Keine Perfektion. Einfach <strong className="text-charcoal">du</strong> — in deinem eigenen Tempo.
        </p>
        <Link href="/auth/register">
          <Button size="lg" className="text-lg px-10 py-4">Kostenlos starten</Button>
        </Link>
      </section>

      {/* 3 Schritte */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-2xl text-center text-charcoal mb-10">So einfach geht&apos;s</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { step: '1', icon: '✨', title: 'Profil ausfüllen',     desc: 'Sag uns was du magst, was dir steht und wie du dich ernährst — ganz entspannt.' },
            { step: '2', icon: '📅', title: 'Woche planen lassen',  desc: 'Die App erstellt dir einen Mahlzeitenplan mit Einkaufsliste — ein Klick genügt.' },
            { step: '3', icon: '💛', title: 'Geniessen & entdecken', desc: 'Koche leckere Rezepte, entdecke deinen Stil und feiere deine kleinen Erfolge.' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-regency-light flex items-center justify-center text-3xl mb-4">{s.icon}</div>
              <h3 className="font-heading text-lg font-semibold text-charcoal mb-2">Schritt {s.step}: {s.title}</h3>
              <p className="text-charcoal-light text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Welcome text with floral background */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="relative bg-gradient-to-br from-rose-light via-cream to-regency-light rounded-3xl p-8 md:p-12 text-center overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.55] pointer-events-none" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="50" fill="#d4a5a5" /><circle cx="55" cy="60" r="35" fill="#e8c4c4" />
            <circle cx="110" cy="65" r="30" fill="#e8c4c4" /><circle cx="70" cy="110" r="32" fill="#e8c4c4" />
            <circle cx="80" cy="80" r="18" fill="#f5e1e1" /><circle cx="40" cy="130" r="22" fill="#d4a5a5" />
            <circle cx="720" cy="60" r="45" fill="#8faabe" /><circle cx="695" cy="40" r="32" fill="#c5d5e0" />
            <circle cx="750" cy="45" r="26" fill="#c5d5e0" /><circle cx="720" cy="90" r="28" fill="#c5d5e0" />
            <circle cx="120" cy="520" r="40" fill="#b5c9a8" /><circle cx="95" cy="505" r="26" fill="#dbe6d3" />
            <circle cx="700" cy="530" r="48" fill="#d4a5a5" /><circle cx="675" cy="510" r="32" fill="#ecd4d4" />
            <circle cx="730" cy="515" r="28" fill="#ecd4d4" /><circle cx="700" cy="560" r="30" fill="#ecd4d4" />
            <path d="M80 130 Q140 200 220 220 Q300 240 340 300" stroke="#b5c9a8" strokeWidth="2.5" fill="none" />
            <path d="M720 105 Q660 190 580 210 Q500 230 460 300" stroke="#8faabe" strokeWidth="2.5" fill="none" />
            <path d="M120 480 Q180 410 260 390 Q340 370 380 310" stroke="#d4a5a5" strokeWidth="2.5" fill="none" />
            <path d="M700 485 Q640 410 560 390 Q480 370 440 310" stroke="#b5c9a8" strokeWidth="2.5" fill="none" />
          </svg>
          <div className="relative z-10">
            <h2 className="font-heading text-2xl md:text-3xl text-charcoal mb-4">Willkommen, so wie du bist</h2>
            <p className="text-charcoal-light leading-relaxed mb-4">
              SpicyHealth ist für Frauen jeden Alters, jeder Figur und jedes Lebensstils.
              Hier geht es nicht um Perfektion — sondern darum, dass du dich <strong className="text-charcoal">wohlfühlst</strong>.
            </p>
            <p className="text-charcoal leading-relaxed font-medium">
              Du bist wunderbar — und diese App ist deine Begleiterin auf dem Weg zu einem genussvollen, bunten Leben. 💛
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-3xl text-center text-charcoal mb-10">Alles, was du brauchst</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map(({ icon, title, description, href }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full group-hover:shadow-card-hover transition-shadow text-center p-8">
                <div className="text-5xl mb-5">{icon}</div>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-3">{title}</h3>
                <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
              </Card>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-10 py-4">Jetzt kostenlos registrieren</Button>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-2xl text-center text-charcoal mb-8">Von Frauen für Frauen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'Endlich eine App die mich nicht zum Abnehmen drängt, sondern mir hilft mich wohlzufühlen. Die Rezepte sind alltagstauglich und richtig lecker!', name: 'Sarah, 34',   detail: 'Zürich' },
            { quote: 'Die Stilberatung hat mir geholfen, meinen eigenen Look zu finden. Und der Mahlzeitenplaner spart mir jede Woche Zeit beim Einkaufen.',             name: 'Nicole, 42', detail: 'Bern' },
            { quote: 'Ich liebe den Wasser-Tracker und die Saisonrezepte! Die App fühlt sich an wie eine gute Freundin die immer einen Tipp hat.',                       name: 'Laura, 28',  detail: 'Basel' },
          ].map((t, i) => (
            <Card key={i} className="p-6 text-center">
              <p className="text-charcoal-light text-sm leading-relaxed italic mb-4">&quot;{t.quote}&quot;</p>
              <p className="font-medium text-charcoal text-sm">{t.name}</p>
              <p className="text-xs text-charcoal-light">{t.detail}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Root page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? <DashboardView /> : <MarketingPage />;
}
