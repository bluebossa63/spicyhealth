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
          Gut essen.<br />
          <span className="text-regency">Großartig fühlen.</span>
        </h1>
        <p className="text-lg text-charcoal-light max-w-xl mx-auto mb-8">
          Gesunde Rezepte, wöchentliche Mahlzeitenplanung, Nährwert-Tracking und smarte Einkaufslisten — alles in einer wunderschönen App.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/recipes"><Button size="lg">Rezepte entdecken</Button></Link>
          <Link href="/auth/register"><Button size="lg" variant="ghost">Kostenlos loslegen</Button></Link>
        </div>
      </section>

      {/* Placeholder lifestyle image strip */}
      <section className="w-full h-64 bg-gradient-to-r from-rose-light via-cream-dark to-sage-light flex items-center justify-center mb-16">
        <p className="text-charcoal-light text-sm italic">[ Lifestyle-Fotografie ]</p>
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
