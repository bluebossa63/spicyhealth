import { Card } from '@/components/ui/Card';
import BackButton from '@/components/BackButton';

export default function DatenschutzPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-charcoal mb-6">Datenschutzerklärung</h1>
      <Card className="p-6 space-y-6 text-sm text-charcoal leading-relaxed">
        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">1. Verantwortliche Stelle</h2>
          <p>nice'n'easy — Cloud, AI & Automation<br />
          Franziska & Daniele Ulrich<br />
          E-Mail: info@niceneasy.ch</p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">2. Erhobene Daten</h2>
          <p>Bei der Nutzung von SpicyHealth erfassen wir:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Registrierungsdaten:</strong> Name, E-Mail-Adresse</li>
            <li><strong>Profildaten:</strong> Ernährungsweise, Körpermasse (freiwillig), Stilpräferenzen</li>
            <li><strong>Nutzungsdaten:</strong> Rezepte, Mahlzeitenpläne, Einkaufslisten, Wohlfühl-Tagebuch</li>
            <li><strong>Hochgeladene Bilder:</strong> Profilfotos, Rezeptbilder, Stilberatungsfotos</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">3. Zweck der Datenverarbeitung</h2>
          <p>Deine Daten werden ausschliesslich verwendet für:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Bereitstellung der App-Funktionen (Rezepte, Planung, Stilberatung)</li>
            <li>Personalisierte Ernährungs- und Stilempfehlungen</li>
            <li>Berechnung von Nährwerten und Kalorienbedarf</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">4. Drittanbieter</h2>
          <p>Wir nutzen folgende Dienste:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Microsoft Azure:</strong> Hosting und Datenspeicherung (Rechenzentrum: West-Europa)</li>
            <li><strong>OpenAI:</strong> KI-gestützte Stilberatung und Bildgenerierung</li>
            <li><strong>FASHN.ai:</strong> Virtual Try-On (Kleidung anprobieren)</li>
            <li><strong>Open Food Facts:</strong> Nährwertdatenbank</li>
            <li><strong>Google:</strong> Anmeldung via Google OAuth (optional)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">5. Datenspeicherung</h2>
          <p>Deine Daten werden auf Microsoft Azure Servern in Westeuropa gespeichert.
          Bilder werden in Azure Blob Storage abgelegt. Wir speichern deine Daten solange
          dein Konto besteht. Du kannst jederzeit die Löschung deines Kontos und aller
          zugehörigen Daten verlangen.</p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">6. Deine Rechte</h2>
          <p>Du hast jederzeit das Recht auf:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Auskunft über deine gespeicherten Daten</li>
            <li>Berichtigung unrichtiger Daten</li>
            <li>Löschung deiner Daten</li>
            <li>Datenübertragbarkeit</li>
            <li>Widerspruch gegen die Verarbeitung</li>
          </ul>
          <p className="mt-2">Kontaktiere uns unter: info@niceneasy.ch</p>
        </section>

        <section>
          <h2 className="font-heading text-lg text-charcoal mb-2">7. Cookies</h2>
          <p>SpicyHealth verwendet nur technisch notwendige Cookies (Anmeldestatus).
          Es werden keine Tracking- oder Werbe-Cookies eingesetzt.</p>
        </section>

        <p className="text-charcoal-light text-xs mt-4">Stand: März 2026</p>
      </Card>
    </main>
  );
}
