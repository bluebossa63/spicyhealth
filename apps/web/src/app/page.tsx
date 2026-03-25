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
      </section>

      {/* Welcome text with Regency floral background */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="relative bg-gradient-to-br from-rose-light via-cream to-regency-light rounded-3xl p-8 md:p-12 text-center overflow-hidden">
          {/* Decorative floral SVG background */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.55] pointer-events-none" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top-left peony cluster */}
            <circle cx="80" cy="80" r="50" fill="#d4a5a5" />
            <circle cx="55" cy="60" r="35" fill="#e8c4c4" />
            <circle cx="110" cy="65" r="30" fill="#e8c4c4" />
            <circle cx="70" cy="110" r="32" fill="#e8c4c4" />
            <circle cx="80" cy="80" r="18" fill="#f5e1e1" />
            <circle cx="40" cy="130" r="22" fill="#d4a5a5" />
            <circle cx="30" cy="120" r="15" fill="#ecd4d4" />
            <circle cx="130" cy="40" r="18" fill="#e8c4c4" />
            {/* Top-right rose cluster */}
            <circle cx="720" cy="60" r="45" fill="#8faabe" />
            <circle cx="695" cy="40" r="32" fill="#c5d5e0" />
            <circle cx="750" cy="45" r="26" fill="#c5d5e0" />
            <circle cx="720" cy="90" r="28" fill="#c5d5e0" />
            <circle cx="720" cy="60" r="14" fill="#e8f0f5" />
            <circle cx="770" cy="95" r="20" fill="#8faabe" />
            <circle cx="760" cy="85" r="14" fill="#c5d5e0" />
            <circle cx="670" cy="100" r="16" fill="#c5d5e0" />
            {/* Top-center small flowers */}
            <circle cx="350" cy="30" r="14" fill="#d4a5a5" />
            <circle cx="340" cy="22" r="9" fill="#ecd4d4" />
            <circle cx="360" cy="25" r="8" fill="#ecd4d4" />
            <circle cx="450" cy="45" r="12" fill="#8faabe" />
            <circle cx="442" cy="38" r="8" fill="#c5d5e0" />
            {/* Left side flowers */}
            <circle cx="30" cy="300" r="20" fill="#b5c9a8" />
            <circle cx="20" cy="290" r="13" fill="#dbe6d3" />
            <circle cx="40" cy="295" r="11" fill="#dbe6d3" />
            <circle cx="60" cy="250" r="15" fill="#d4a5a5" />
            <circle cx="52" cy="242" r="10" fill="#ecd4d4" />
            {/* Right side flowers */}
            <circle cx="775" cy="280" r="18" fill="#d4a5a5" />
            <circle cx="765" cy="272" r="12" fill="#ecd4d4" />
            <circle cx="760" cy="340" r="14" fill="#b5c9a8" />
            <circle cx="752" cy="333" r="9" fill="#dbe6d3" />
            {/* Bottom-left flower cluster */}
            <circle cx="120" cy="520" r="40" fill="#b5c9a8" />
            <circle cx="95" cy="505" r="26" fill="#dbe6d3" />
            <circle cx="145" cy="508" r="24" fill="#dbe6d3" />
            <circle cx="120" cy="545" r="26" fill="#dbe6d3" />
            <circle cx="120" cy="520" r="12" fill="#eef3ea" />
            <circle cx="60" cy="560" r="18" fill="#8faabe" />
            <circle cx="52" cy="552" r="12" fill="#c5d5e0" />
            <circle cx="170" cy="570" r="15" fill="#d4a5a5" />
            {/* Bottom-right peony cluster */}
            <circle cx="700" cy="530" r="48" fill="#d4a5a5" />
            <circle cx="675" cy="510" r="32" fill="#ecd4d4" />
            <circle cx="730" cy="515" r="28" fill="#ecd4d4" />
            <circle cx="700" cy="560" r="30" fill="#ecd4d4" />
            <circle cx="700" cy="530" r="16" fill="#f5e1e1" />
            <circle cx="755" cy="565" r="20" fill="#b5c9a8" />
            <circle cx="648" cy="570" r="16" fill="#8faabe" />
            {/* Bottom-center flowers */}
            <circle cx="400" cy="570" r="16" fill="#d4a5a5" />
            <circle cx="392" cy="562" r="10" fill="#ecd4d4" />
            <circle cx="320" cy="555" r="12" fill="#b5c9a8" />
            <circle cx="480" cy="560" r="13" fill="#8faabe" />
            {/* Vine/stems */}
            <path d="M80 130 Q140 200 220 220 Q300 240 340 300" stroke="#b5c9a8" strokeWidth="2.5" fill="none" />
            <path d="M720 105 Q660 190 580 210 Q500 230 460 300" stroke="#8faabe" strokeWidth="2.5" fill="none" />
            <path d="M120 480 Q180 410 260 390 Q340 370 380 310" stroke="#d4a5a5" strokeWidth="2.5" fill="none" />
            <path d="M700 485 Q640 410 560 390 Q480 370 440 310" stroke="#b5c9a8" strokeWidth="2.5" fill="none" />
            <path d="M30 130 Q20 200 30 260" stroke="#d4a5a5" strokeWidth="2" fill="none" />
            <path d="M770 130 Q780 200 775 250" stroke="#b5c9a8" strokeWidth="2" fill="none" />
            {/* Small accent flowers along vines */}
            <circle cx="220" cy="220" r="10" fill="#d4a5a5" />
            <circle cx="580" cy="210" r="10" fill="#8faabe" />
            <circle cx="260" cy="390" r="10" fill="#b5c9a8" />
            <circle cx="560" cy="390" r="10" fill="#d4a5a5" />
            <circle cx="300" cy="270" r="7" fill="#e8c4c4" />
            <circle cx="500" cy="260" r="7" fill="#c5d5e0" />
            {/* Leaves along vines */}
            <ellipse cx="150" cy="170" rx="16" ry="7" transform="rotate(-30 150 170)" fill="#b5c9a8" />
            <ellipse cx="650" cy="160" rx="16" ry="7" transform="rotate(30 650 160)" fill="#b5c9a8" />
            <ellipse cx="190" cy="430" rx="16" ry="7" transform="rotate(20 190 430)" fill="#b5c9a8" />
            <ellipse cx="610" cy="420" rx="16" ry="7" transform="rotate(-20 610 420)" fill="#b5c9a8" />
            <ellipse cx="270" cy="250" rx="12" ry="5" transform="rotate(-45 270 250)" fill="#b5c9a8" />
            <ellipse cx="530" cy="240" rx="12" ry="5" transform="rotate(45 530 240)" fill="#b5c9a8" />
            <ellipse cx="320" cy="350" rx="12" ry="5" transform="rotate(30 320 350)" fill="#b5c9a8" />
            <ellipse cx="490" cy="345" rx="12" ry="5" transform="rotate(-30 490 345)" fill="#b5c9a8" />
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

        {/* Call to action — after features overview */}
        <div className="text-center mt-12">
          <Link href="/recipes">
            <Button size="lg">Lass dich inspirieren</Button>
          </Link>
        </div>
      </section>

      {/* Social proof — testimonials */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-2xl text-center text-charcoal mb-8">Von Frauen für Frauen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: 'Endlich eine App die mich nicht zum Abnehmen drängt, sondern mir hilft mich wohlzufühlen. Die Rezepte sind alltagstauglich und richtig lecker!',
              name: 'Sarah, 34',
              detail: 'Zürich',
            },
            {
              quote: 'Die Stilberatung hat mir geholfen, meinen eigenen Look zu finden. Und der Mahlzeitenplaner spart mir jede Woche Zeit beim Einkaufen.',
              name: 'Nicole, 42',
              detail: 'Bern',
            },
            {
              quote: 'Ich liebe den Wasser-Tracker und die Saisonrezepte! Die App fühlt sich an wie eine gute Freundin die immer einen Tipp hat.',
              name: 'Laura, 28',
              detail: 'Basel',
            },
          ].map((t, i) => (
            <Card key={i} className="p-6 text-center">
              <p className="text-charcoal-light text-sm leading-relaxed italic mb-4">"{t.quote}"</p>
              <p className="font-medium text-charcoal text-sm">{t.name}</p>
              <p className="text-xs text-charcoal-light">{t.detail}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
