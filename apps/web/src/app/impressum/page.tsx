import { Card } from '@/components/ui/Card';

export default function ImpressumPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl text-charcoal mb-6">Impressum</h1>
      <Card className="p-6 space-y-6 text-sm text-charcoal leading-relaxed">
        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">Betreiberin</h2>
          <p>nice'n'easy — Cloud, AI & Automation<br />
          Franziska & Daniele Ulrich<br />
          Schweiz</p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">Kontakt</h2>
          <p>E-Mail: info@niceneasy.ch<br />
          Website: <a href="https://www.niceneasy.ch" className="text-regency hover:text-regency-dark">www.niceneasy.ch</a></p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">Haftungsausschluss</h2>
          <p>Die Inhalte dieser App wurden mit grösstmöglicher Sorgfalt erstellt.
          Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
          jedoch keine Gewähr übernehmen.</p>
          <p className="mt-2">Die Ernährungs- und Stilberatung in dieser App ersetzt keine professionelle
          medizinische oder ernährungswissenschaftliche Beratung. Die Nährwertangaben
          sind Schätzwerte und können vom tatsächlichen Gehalt abweichen.</p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">Urheberrecht</h2>
          <p>Die durch die Betreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem Schweizer Urheberrecht. Die KI-generierten Bilder unterliegen
          den jeweiligen Nutzungsbedingungen der verwendeten KI-Dienste.</p>
        </section>

        <p className="text-charcoal-light text-xs mt-4">Stand: März 2026</p>
      </Card>
    </main>
  );
}
