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
        <div className="flex justify-center">
          <Link href="/recipes"><Button size="lg">Lass dich inspirieren</Button></Link>
        </div>
      </section>

      {/* Welcome text with Regency floral background */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="relative bg-gradient-to-br from-rose-light via-cream to-regency-light rounded-3xl p-8 md:p-12 text-center overflow-hidden">
          {/* Decorative floral SVG background */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.25] pointer-events-none" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top-left peony */}
            <circle cx="80" cy="80" r="45" fill="#d4a5a5" />
            <circle cx="60" cy="65" r="30" fill="#e8c4c4" />
            <circle cx="100" cy="70" r="25" fill="#e8c4c4" />
            <circle cx="75" cy="100" r="28" fill="#e8c4c4" />
            <circle cx="80" cy="80" r="15" fill="#f5e1e1" />
            {/* Top-right rose */}
            <circle cx="720" cy="60" r="40" fill="#8faabe" />
            <circle cx="700" cy="45" r="28" fill="#c5d5e0" />
            <circle cx="740" cy="50" r="22" fill="#c5d5e0" />
            <circle cx="720" cy="80" r="24" fill="#c5d5e0" />
            <circle cx="720" cy="60" r="12" fill="#e8f0f5" />
            {/* Bottom-left flower */}
            <circle cx="120" cy="520" r="35" fill="#b5c9a8" />
            <circle cx="100" cy="510" r="22" fill="#dbe6d3" />
            <circle cx="140" cy="510" r="20" fill="#dbe6d3" />
            <circle cx="120" cy="540" r="22" fill="#dbe6d3" />
            <circle cx="120" cy="520" r="10" fill="#eef3ea" />
            {/* Bottom-right peony */}
            <circle cx="700" cy="530" r="42" fill="#d4a5a5" />
            <circle cx="680" cy="515" r="28" fill="#ecd4d4" />
            <circle cx="720" cy="520" r="24" fill="#ecd4d4" />
            <circle cx="700" cy="550" r="26" fill="#ecd4d4" />
            <circle cx="700" cy="530" r="14" fill="#f5e1e1" />
            {/* Vine/stems */}
            <path d="M80 125 Q120 200 200 220 Q280 240 300 300" stroke="#b5c9a8" strokeWidth="2" fill="none" />
            <path d="M720 100 Q680 180 600 200 Q520 220 500 280" stroke="#8faabe" strokeWidth="2" fill="none" />
            <path d="M120 485 Q160 420 240 400 Q320 380 340 320" stroke="#d4a5a5" strokeWidth="2" fill="none" />
            <path d="M700 490 Q660 420 580 400 Q500 380 480 320" stroke="#b5c9a8" strokeWidth="2" fill="none" />
            {/* Small accent flowers */}
            <circle cx="200" cy="220" r="8" fill="#d4a5a5" opacity="0.6" />
            <circle cx="600" cy="200" r="8" fill="#8faabe" opacity="0.6" />
            <circle cx="240" cy="400" r="8" fill="#b5c9a8" opacity="0.6" />
            <circle cx="580" cy="400" r="8" fill="#d4a5a5" opacity="0.6" />
            {/* Leaves */}
            <ellipse cx="160" cy="180" rx="12" ry="6" transform="rotate(-30 160 180)" fill="#b5c9a8" opacity="0.5" />
            <ellipse cx="640" cy="170" rx="12" ry="6" transform="rotate(30 640 170)" fill="#b5c9a8" opacity="0.5" />
            <ellipse cx="180" cy="440" rx="12" ry="6" transform="rotate(20 180 440)" fill="#b5c9a8" opacity="0.5" />
            <ellipse cx="620" cy="430" rx="12" ry="6" transform="rotate(-20 620 430)" fill="#b5c9a8" opacity="0.5" />
            {/* Center small decorations */}
            <circle cx="400" cy="50" r="5" fill="#d4a5a5" opacity="0.4" />
            <circle cx="380" cy="550" r="5" fill="#8faabe" opacity="0.4" />
            <circle cx="50" cy="300" r="5" fill="#b5c9a8" opacity="0.4" />
            <circle cx="750" cy="300" r="5" fill="#d4a5a5" opacity="0.4" />
          </svg>

          <div className="relative z-10">
            <h2 className="font-heading text-2xl md:text-3xl text-charcoal mb-4">
              Willkommen, so wie du bist
            </h2>
            <p className="text-charcoal-light leading-relaxed mb-4">
              SpicyHealth ist für Frauen jeden Alters, jeder Figur und jedes Lebensstils.
              Hier geht es nicht um Perfektion — sondern darum, dass du dich <strong className="text-charcoal">wohlfühlst</strong>,
              Freude am Kochen hast oder entdeckst und deinen ganz persönlichen Stil findest.
            </p>
            <p className="text-charcoal-light leading-relaxed mb-4">
              Lass dich von leckeren Rezepten inspirieren, plane deine Woche entspannt,
              teile es mit deinen Freundinnen, probiere neue Looks aus und feiere die kleinen Erfolge im Alltag.
              Alles in deinem Tempo, ohne Druck, ohne Bewertung.
            </p>
            <p className="text-charcoal leading-relaxed font-medium">
              Du bist wunderbar — und diese App ist deine Begleiterin auf dem Weg
              zu einem genussvollen, bunten Leben. 💛
            </p>
          </div>
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
