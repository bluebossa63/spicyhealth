'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface SeasonalItem {
  name: string;
  emoji: string;
  type: 'gemuese' | 'frucht' | 'kraeuter';
}

const SEASONAL: Record<number, SeasonalItem[]> = {
  0: [ // Januar
    { name: 'Rüebli', emoji: '🥕', type: 'gemuese' }, { name: 'Lauch', emoji: '🧅', type: 'gemuese' },
    { name: 'Rosenkohl', emoji: '🥦', type: 'gemuese' }, { name: 'Kabis', emoji: '🥬', type: 'gemuese' },
    { name: 'Sellerie', emoji: '🥬', type: 'gemuese' }, { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht' },
    { name: 'Birnen (Lager)', emoji: '🍐', type: 'frucht' },
  ],
  1: [ // Februar
    { name: 'Nüsslisalat', emoji: '🥬', type: 'gemuese' }, { name: 'Rüebli', emoji: '🥕', type: 'gemuese' },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese' }, { name: 'Chicorée', emoji: '🥬', type: 'gemuese' },
    { name: 'Kabis', emoji: '🥬', type: 'gemuese' }, { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht' },
  ],
  2: [ // März
    { name: 'Spinat', emoji: '🥬', type: 'gemuese' }, { name: 'Nüsslisalat', emoji: '🥬', type: 'gemuese' },
    { name: 'Rüebli', emoji: '🥕', type: 'gemuese' }, { name: 'Bärlauch', emoji: '🌿', type: 'kraeuter' },
    { name: 'Rhabarber', emoji: '🌱', type: 'frucht' },
  ],
  3: [ // April
    { name: 'Spargel', emoji: '🌿', type: 'gemuese' }, { name: 'Spinat', emoji: '🥬', type: 'gemuese' },
    { name: 'Radieschen', emoji: '🔴', type: 'gemuese' }, { name: 'Rhabarber', emoji: '🌱', type: 'frucht' },
    { name: 'Bärlauch', emoji: '🌿', type: 'kraeuter' }, { name: 'Schnittlauch', emoji: '🌿', type: 'kraeuter' },
  ],
  4: [ // Mai
    { name: 'Spargel', emoji: '🌿', type: 'gemuese' }, { name: 'Erdbeeren', emoji: '🍓', type: 'frucht' },
    { name: 'Spinat', emoji: '🥬', type: 'gemuese' }, { name: 'Radieschen', emoji: '🔴', type: 'gemuese' },
    { name: 'Kohlrabi', emoji: '🥬', type: 'gemuese' }, { name: 'Rhabarber', emoji: '🌱', type: 'frucht' },
    { name: 'Kopfsalat', emoji: '🥗', type: 'gemuese' },
  ],
  5: [ // Juni
    { name: 'Erdbeeren', emoji: '🍓', type: 'frucht' }, { name: 'Kirschen', emoji: '🍒', type: 'frucht' },
    { name: 'Zucchetti', emoji: '🥒', type: 'gemuese' }, { name: 'Erbsen', emoji: '🟢', type: 'gemuese' },
    { name: 'Blumenkohl', emoji: '🥦', type: 'gemuese' }, { name: 'Gurken', emoji: '🥒', type: 'gemuese' },
    { name: 'Brokkoli', emoji: '🥦', type: 'gemuese' },
  ],
  6: [ // Juli
    { name: 'Tomaten', emoji: '🍅', type: 'gemuese' }, { name: 'Peperoni', emoji: '🌶️', type: 'gemuese' },
    { name: 'Heidelbeeren', emoji: '🫐', type: 'frucht' }, { name: 'Himbeeren', emoji: '🫐', type: 'frucht' },
    { name: 'Aprikosen', emoji: '🍑', type: 'frucht' }, { name: 'Bohnen', emoji: '🟢', type: 'gemuese' },
    { name: 'Aubergine', emoji: '🍆', type: 'gemuese' }, { name: 'Basilikum', emoji: '🌿', type: 'kraeuter' },
  ],
  7: [ // August
    { name: 'Tomaten', emoji: '🍅', type: 'gemuese' }, { name: 'Peperoni', emoji: '🌶️', type: 'gemuese' },
    { name: 'Pflaumen', emoji: '🫐', type: 'frucht' }, { name: 'Heidelbeeren', emoji: '🫐', type: 'frucht' },
    { name: 'Mais', emoji: '🌽', type: 'gemuese' }, { name: 'Aubergine', emoji: '🍆', type: 'gemuese' },
    { name: 'Pfirsiche', emoji: '🍑', type: 'frucht' }, { name: 'Fenchel', emoji: '🥬', type: 'gemuese' },
  ],
  8: [ // September
    { name: 'Trauben', emoji: '🍇', type: 'frucht' }, { name: 'Äpfel', emoji: '🍎', type: 'frucht' },
    { name: 'Birnen', emoji: '🍐', type: 'frucht' }, { name: 'Kürbis', emoji: '🎃', type: 'gemuese' },
    { name: 'Randen', emoji: '🔴', type: 'gemuese' }, { name: 'Tomaten', emoji: '🍅', type: 'gemuese' },
    { name: 'Zwetschgen', emoji: '🫐', type: 'frucht' },
  ],
  9: [ // Oktober
    { name: 'Kürbis', emoji: '🎃', type: 'gemuese' }, { name: 'Äpfel', emoji: '🍎', type: 'frucht' },
    { name: 'Birnen', emoji: '🍐', type: 'frucht' }, { name: 'Randen', emoji: '🔴', type: 'gemuese' },
    { name: 'Federkohl', emoji: '🥬', type: 'gemuese' }, { name: 'Süsskartoffeln', emoji: '🍠', type: 'gemuese' },
    { name: 'Quitten', emoji: '🍎', type: 'frucht' },
  ],
  10: [ // November
    { name: 'Kürbis', emoji: '🎃', type: 'gemuese' }, { name: 'Federkohl', emoji: '🥬', type: 'gemuese' },
    { name: 'Rüebli', emoji: '🥕', type: 'gemuese' }, { name: 'Lauch', emoji: '🧅', type: 'gemuese' },
    { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht' }, { name: 'Sellerie', emoji: '🥬', type: 'gemuese' },
  ],
  11: [ // Dezember
    { name: 'Rosenkohl', emoji: '🥦', type: 'gemuese' }, { name: 'Rüebli', emoji: '🥕', type: 'gemuese' },
    { name: 'Lauch', emoji: '🧅', type: 'gemuese' }, { name: 'Kabis', emoji: '🥬', type: 'gemuese' },
    { name: 'Nüsse', emoji: '🥜', type: 'frucht' }, { name: 'Äpfel (Lager)', emoji: '🍎', type: 'frucht' },
    { name: 'Mandarinen', emoji: '🍊', type: 'frucht' },
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
      <h1 className="font-heading text-3xl text-charcoal mb-2">🍓 Saisonkalender</h1>
      <p className="text-sm text-charcoal-light mb-6">
        Was hat gerade Saison in der Schweiz? Frisch, regional und nachhaltig einkaufen.
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
                <span key={item.name} className="bg-cream rounded-xl px-3 py-1.5 text-sm text-charcoal flex items-center gap-1.5">
                  {item.emoji} {item.name}
                </span>
              ))}
            </div>
          </Card>
        );
      })}

      <div className="text-center mt-6">
        <Link href="/recipes" className="btn-primary text-sm">
          Passende Rezepte finden →
        </Link>
      </div>
    </main>
  );
}
