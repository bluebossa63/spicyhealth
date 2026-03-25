'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface SeasonalItem {
  name: string;
  emoji: string;
  type: 'gemuese' | 'frucht' | 'kraeuter';
  searchTerms: string[]; // terms to search recipes for
}

const SEASONAL: Record<number, SeasonalItem[]> = {
  0: [ // Januar
    { name: 'Rüebli / Karotten', emoji: '🥕', type: 'gemuese', searchTerms: ['karotten', 'rüebli', 'karotte'] },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese', searchTerms: ['lauch'] },
    { name: 'Rosenkohl', emoji: '🥦', type: 'gemuese', searchTerms: ['rosenkohl'] },
    { name: 'Kabis / Weisskohl', emoji: '🥬', type: 'gemuese', searchTerms: ['kabis', 'kohl', 'weisskohl'] },
    { name: 'Sellerie', emoji: '🥬', type: 'gemuese', searchTerms: ['sellerie'] },
    { name: 'Kartoffeln', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel', 'kartoffeln'] },
    { name: 'Zwiebeln', emoji: '🧅', type: 'gemuese', searchTerms: ['zwiebel', 'zwiebeln'] },
    { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht', searchTerms: ['apfel', 'äpfel'] },
    { name: 'Birnen (Lager)', emoji: '🍐', type: 'frucht', searchTerms: ['birne', 'birnen'] },
  ],
  1: [ // Februar
    { name: 'Nüsslisalat', emoji: '🥬', type: 'gemuese', searchTerms: ['nüsslisalat', 'salat'] },
    { name: 'Rüebli / Karotten', emoji: '🥕', type: 'gemuese', searchTerms: ['karotten', 'rüebli'] },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese', searchTerms: ['lauch'] },
    { name: 'Chicorée', emoji: '🥬', type: 'gemuese', searchTerms: ['chicorée'] },
    { name: 'Kabis', emoji: '🥬', type: 'gemuese', searchTerms: ['kabis', 'kohl'] },
    { name: 'Kartoffeln', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel'] },
    { name: 'Randen / Rote Bete', emoji: '🔴', type: 'gemuese', searchTerms: ['randen', 'rote bete'] },
    { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht', searchTerms: ['apfel'] },
  ],
  2: [ // März
    { name: 'Spinat', emoji: '🥬', type: 'gemuese', searchTerms: ['spinat'] },
    { name: 'Nüsslisalat', emoji: '🥬', type: 'gemuese', searchTerms: ['nüsslisalat', 'salat'] },
    { name: 'Rüebli / Karotten', emoji: '🥕', type: 'gemuese', searchTerms: ['karotten', 'rüebli'] },
    { name: 'Kartoffeln', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel'] },
    { name: 'Bärlauch', emoji: '🌿', type: 'kraeuter', searchTerms: ['bärlauch'] },
    { name: 'Rhabarber', emoji: '🌱', type: 'frucht', searchTerms: ['rhabarber'] },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese', searchTerms: ['lauch'] },
  ],
  3: [ // April
    { name: 'Spargel', emoji: '🌿', type: 'gemuese', searchTerms: ['spargel'] },
    { name: 'Spinat', emoji: '🥬', type: 'gemuese', searchTerms: ['spinat'] },
    { name: 'Radieschen', emoji: '🔴', type: 'gemuese', searchTerms: ['radieschen'] },
    { name: 'Rhabarber', emoji: '🌱', type: 'frucht', searchTerms: ['rhabarber'] },
    { name: 'Bärlauch', emoji: '🌿', type: 'kraeuter', searchTerms: ['bärlauch'] },
    { name: 'Schnittlauch', emoji: '🌿', type: 'kraeuter', searchTerms: ['schnittlauch'] },
    { name: 'Kopfsalat', emoji: '🥗', type: 'gemuese', searchTerms: ['salat', 'kopfsalat'] },
    { name: 'Kartoffeln (neu)', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel'] },
  ],
  4: [ // Mai
    { name: 'Spargel', emoji: '🌿', type: 'gemuese', searchTerms: ['spargel'] },
    { name: 'Erdbeeren', emoji: '🍓', type: 'frucht', searchTerms: ['erdbeere', 'erdbeeren'] },
    { name: 'Spinat', emoji: '🥬', type: 'gemuese', searchTerms: ['spinat'] },
    { name: 'Radieschen', emoji: '🔴', type: 'gemuese', searchTerms: ['radieschen'] },
    { name: 'Kohlrabi', emoji: '🥬', type: 'gemuese', searchTerms: ['kohlrabi'] },
    { name: 'Rhabarber', emoji: '🌱', type: 'frucht', searchTerms: ['rhabarber'] },
    { name: 'Kopfsalat', emoji: '🥗', type: 'gemuese', searchTerms: ['salat'] },
    { name: 'Erbsen', emoji: '🟢', type: 'gemuese', searchTerms: ['erbsen'] },
  ],
  5: [ // Juni
    { name: 'Erdbeeren', emoji: '🍓', type: 'frucht', searchTerms: ['erdbeere', 'erdbeeren'] },
    { name: 'Kirschen', emoji: '🍒', type: 'frucht', searchTerms: ['kirsche', 'kirschen'] },
    { name: 'Zucchetti / Zucchini', emoji: '🥒', type: 'gemuese', searchTerms: ['zucchetti', 'zucchini'] },
    { name: 'Erbsen', emoji: '🟢', type: 'gemuese', searchTerms: ['erbsen'] },
    { name: 'Blumenkohl', emoji: '🥦', type: 'gemuese', searchTerms: ['blumenkohl'] },
    { name: 'Gurken', emoji: '🥒', type: 'gemuese', searchTerms: ['gurke', 'gurken'] },
    { name: 'Brokkoli', emoji: '🥦', type: 'gemuese', searchTerms: ['brokkoli'] },
    { name: 'Bohnen', emoji: '🟢', type: 'gemuese', searchTerms: ['bohne', 'bohnen'] },
    { name: 'Basilikum', emoji: '🌿', type: 'kraeuter', searchTerms: ['basilikum'] },
  ],
  6: [ // Juli
    { name: 'Tomaten', emoji: '🍅', type: 'gemuese', searchTerms: ['tomate', 'tomaten'] },
    { name: 'Peperoni / Paprika', emoji: '🌶️', type: 'gemuese', searchTerms: ['peperoni', 'paprika'] },
    { name: 'Heidelbeeren', emoji: '🫐', type: 'frucht', searchTerms: ['heidelbeere', 'blaubeere', 'beeren'] },
    { name: 'Himbeeren', emoji: '🫐', type: 'frucht', searchTerms: ['himbeere', 'beeren'] },
    { name: 'Aprikosen', emoji: '🍑', type: 'frucht', searchTerms: ['aprikose'] },
    { name: 'Bohnen', emoji: '🟢', type: 'gemuese', searchTerms: ['bohne', 'bohnen'] },
    { name: 'Aubergine', emoji: '🍆', type: 'gemuese', searchTerms: ['aubergine'] },
    { name: 'Zucchetti', emoji: '🥒', type: 'gemuese', searchTerms: ['zucchetti', 'zucchini'] },
    { name: 'Gurken', emoji: '🥒', type: 'gemuese', searchTerms: ['gurke', 'gurken'] },
    { name: 'Basilikum', emoji: '🌿', type: 'kraeuter', searchTerms: ['basilikum'] },
  ],
  7: [ // August
    { name: 'Tomaten', emoji: '🍅', type: 'gemuese', searchTerms: ['tomate', 'tomaten'] },
    { name: 'Peperoni / Paprika', emoji: '🌶️', type: 'gemuese', searchTerms: ['peperoni', 'paprika', 'peperoni'] },
    { name: 'Pflaumen / Zwetschgen', emoji: '🫐', type: 'frucht', searchTerms: ['pflaume', 'zwetschge'] },
    { name: 'Heidelbeeren', emoji: '🫐', type: 'frucht', searchTerms: ['heidelbeere', 'beeren'] },
    { name: 'Mais', emoji: '🌽', type: 'gemuese', searchTerms: ['mais'] },
    { name: 'Aubergine', emoji: '🍆', type: 'gemuese', searchTerms: ['aubergine'] },
    { name: 'Pfirsiche', emoji: '🍑', type: 'frucht', searchTerms: ['pfirsich'] },
    { name: 'Fenchel', emoji: '🥬', type: 'gemuese', searchTerms: ['fenchel'] },
    { name: 'Bohnen', emoji: '🟢', type: 'gemuese', searchTerms: ['bohne', 'bohnen'] },
  ],
  8: [ // September
    { name: 'Trauben', emoji: '🍇', type: 'frucht', searchTerms: ['traube', 'trauben'] },
    { name: 'Äpfel', emoji: '🍎', type: 'frucht', searchTerms: ['apfel', 'äpfel'] },
    { name: 'Birnen', emoji: '🍐', type: 'frucht', searchTerms: ['birne', 'birnen'] },
    { name: 'Kürbis', emoji: '🎃', type: 'gemuese', searchTerms: ['kürbis'] },
    { name: 'Randen / Rote Bete', emoji: '🔴', type: 'gemuese', searchTerms: ['randen', 'rote bete'] },
    { name: 'Tomaten', emoji: '🍅', type: 'gemuese', searchTerms: ['tomate', 'tomaten'] },
    { name: 'Zwetschgen', emoji: '🫐', type: 'frucht', searchTerms: ['zwetschge'] },
    { name: 'Süsskartoffeln', emoji: '🍠', type: 'gemuese', searchTerms: ['süsskartoffel'] },
    { name: 'Brokkoli', emoji: '🥦', type: 'gemuese', searchTerms: ['brokkoli'] },
  ],
  9: [ // Oktober
    { name: 'Kürbis', emoji: '🎃', type: 'gemuese', searchTerms: ['kürbis'] },
    { name: 'Äpfel', emoji: '🍎', type: 'frucht', searchTerms: ['apfel', 'äpfel'] },
    { name: 'Birnen', emoji: '🍐', type: 'frucht', searchTerms: ['birne'] },
    { name: 'Randen / Rote Bete', emoji: '🔴', type: 'gemuese', searchTerms: ['randen'] },
    { name: 'Federkohl / Grünkohl', emoji: '🥬', type: 'gemuese', searchTerms: ['federkohl', 'grünkohl', 'kohl'] },
    { name: 'Süsskartoffeln', emoji: '🍠', type: 'gemuese', searchTerms: ['süsskartoffel'] },
    { name: 'Quitten', emoji: '🍎', type: 'frucht', searchTerms: ['quitte'] },
    { name: 'Kartoffeln', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel'] },
    { name: 'Spinat', emoji: '🥬', type: 'gemuese', searchTerms: ['spinat'] },
  ],
  10: [ // November
    { name: 'Kürbis', emoji: '🎃', type: 'gemuese', searchTerms: ['kürbis'] },
    { name: 'Federkohl / Grünkohl', emoji: '🥬', type: 'gemuese', searchTerms: ['federkohl', 'kohl'] },
    { name: 'Rüebli / Karotten', emoji: '🥕', type: 'gemuese', searchTerms: ['karotten', 'rüebli'] },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese', searchTerms: ['lauch'] },
    { name: 'Sellerie', emoji: '🥬', type: 'gemuese', searchTerms: ['sellerie'] },
    { name: 'Kartoffeln', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel'] },
    { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht', searchTerms: ['apfel'] },
    { name: 'Birnen (Lager)', emoji: '🍐', type: 'frucht', searchTerms: ['birne'] },
  ],
  11: [ // Dezember
    { name: 'Rosenkohl', emoji: '🥦', type: 'gemuese', searchTerms: ['rosenkohl'] },
    { name: 'Rüebli / Karotten', emoji: '🥕', type: 'gemuese', searchTerms: ['karotten', 'rüebli'] },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese', searchTerms: ['lauch'] },
    { name: 'Kabis', emoji: '🥬', type: 'gemuese', searchTerms: ['kabis', 'kohl'] },
    { name: 'Kartoffeln', emoji: '🥔', type: 'gemuese', searchTerms: ['kartoffel'] },
    { name: 'Nüsse', emoji: '🥜', type: 'frucht', searchTerms: ['nüsse', 'walnüsse', 'mandeln'] },
    { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht', searchTerms: ['apfel'] },
    { name: 'Mandarinen', emoji: '🍊', type: 'frucht', searchTerms: ['mandarine'] },
    { name: 'Orangen', emoji: '🍊', type: 'frucht', searchTerms: ['orange'] },
  ],
};

const TYPE_LABELS: Record<string, string> = { gemuese: '🥬 Gemüse', frucht: '🍎 Früchte', kraeuter: '🌿 Kräuter' };

export default function SaisonkalenderPage() {
  const currentMonth = new Date().getMonth();
  const [month, setMonth] = useState(currentMonth);
  const items = SEASONAL[month] || [];
  const grouped = {
    gemuese: items.filter(i => i.type === 'gemuese'),
    frucht: items.filter(i => i.type === 'frucht'),
    kraeuter: items.filter(i => i.type === 'kraeuter'),
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-charcoal mb-2">🍓 Saisonkalender</h1>
      <p className="text-sm text-charcoal-light mb-6">
        Was hat gerade Saison in der Schweiz? Tippe auf eine Zutat um passende Rezepte zu finden.
      </p>

      {/* Month selector */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {MONTHS.map((name, i) => (
          <button
            key={i}
            onClick={() => setMonth(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === month ? 'bg-regency text-white' : i === currentMonth ? 'bg-regency-light text-charcoal' : 'bg-cream-dark text-charcoal-light hover:bg-regency-light'
            }`}
          >
            {name.substring(0, 3)}
          </button>
        ))}
      </div>

      <h2 className="font-heading text-2xl text-charcoal mb-4">
        {MONTHS[month]}
      </h2>

      {(['gemuese', 'frucht', 'kraeuter'] as const).map(type => {
        const group = grouped[type];
        if (!group.length) return null;
        return (
          <Card key={type} className="p-5 mb-4">
            <h3 className="font-medium text-charcoal mb-3">{TYPE_LABELS[type]}</h3>
            <div className="flex flex-wrap gap-2">
              {group.map(item => (
                <Link
                  key={item.name}
                  href={`/recipes?search=${encodeURIComponent(item.searchTerms[0])}`}
                  className="bg-cream rounded-xl px-3 py-1.5 text-sm text-charcoal flex items-center gap-1.5 hover:bg-regency-light transition-colors"
                >
                  {item.emoji} {item.name}
                </Link>
              ))}
            </div>
          </Card>
        );
      })}

      <div className="text-center mt-6">
        <Link href="/recipes" className="btn-primary text-sm">
          Alle Rezepte anzeigen →
        </Link>
      </div>
    </main>
  );
}
