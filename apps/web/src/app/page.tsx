import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    icon: '🥗',
    title: 'Rezeptbibliothek',
    description: 'Hunderte gesunde Rezepte mit vollständigen Nährwertangaben und Kostenübersicht.',
    href: '/recipes',
  },
  {
    icon: '📅',
    title: 'Mahlzeitenplaner',
    description: 'Plane deine Woche mit einem wunderschönen Drag-and-Drop-Planer.',
    href: '/meal-planner',
  },
  {
    icon: '🛒',
    title: 'Smarte Einkaufsliste',
    description: 'Generiere deine Einkaufsliste automatisch aus dem wöchentlichen Mahlzeitenplan.',
    href: '/shopping-list',
  },
  {
    icon: '👗',
    title: 'Styling',
    description: 'Deine persönliche Stilberaterin — entdecke deinen Look mit KI-gestützter Modeberatung.',
    href: '/umstyling',
  },
  {
    icon: '📸',
    title: 'Outfit-Galerie',
    description: 'Dein persönliches Style-Board — alle Outfits aus deinen Stilberatungen gesammelt.',
    href: '/outfit-galerie',
  },
  {
    icon: '✨',
    title: 'Mein Tag',
    description: 'Wasser-Tracker, Stimmungstagebuch und deine täglichen Erfolge auf einen Blick.',
    href: '/mein-tag',
  },
  {
    icon: '🍓',
    title: 'Saisonkalender',
    description: 'Was hat gerade Saison in der Schweiz? Frisch und regional einkaufen.',
    href: '/saisonkalender',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-4">
          Dein Wohlfühl-Ort.<br />
          <span className="text-regency">Für dich gemacht.</span>
        </h1>
        <p className="text-lg text-charcoal-light max-w-xl mx-auto mb-8">
          Keine Diäten. Keine Vorschriften. Einfach gut essen, sich schön fühlen
          und Spass haben — in deinem eigenen Tempo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/recipes"><Button size="lg">Rezepte entdecken</Button></Link>
          <Link href="/auth/register"><Button size="lg" variant="ghost">Kostenlos loslegen</Button></Link>
        </div>
      </section>

      {/* Welcome text */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-rose-light via-cream to-regency-light rounded-3xl p-8 md:p-12 text-center">
          <h2 className="font-heading text-2xl md:text-3xl text-charcoal mb-4">
            Willkommen, so wie du bist
          </h2>
          <p className="text-charcoal-light leading-relaxed mb-4">
            SpicyHealth ist für Frauen jeden Alters, jeder Figur und jedes Lebensstils.
            Hier geht es nicht um Perfektion — sondern darum, dass du dich <strong className="text-charcoal">wohlfühlst</strong>,
            Freude am Kochen entdeckst und deinen ganz persönlichen Stil findest.
          </p>
          <p className="text-charcoal-light leading-relaxed mb-4">
            Lass dich von leckeren Rezepten inspirieren, plane deine Woche entspannt,
            probiere neue Looks aus und feiere die kleinen Erfolge im Alltag.
            Alles in deinem Tempo, ohne Druck, ohne Bewertung.
          </p>
          <p className="text-charcoal leading-relaxed font-medium">
            Du bist wunderbar — und diese App ist deine Begleiterin auf dem Weg
            zu einem genussvollen, bunten Leben. 💛
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-3xl text-center text-charcoal mb-10">Alles, was du brauchst</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map(({ icon, title, description, href }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full group-hover:shadow-card-hover transition-shadow text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">{title}</h3>
                <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
