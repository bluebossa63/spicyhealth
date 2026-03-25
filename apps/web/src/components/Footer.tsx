import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-rose-light bg-cream-dark mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <p className="font-heading text-xl text-regency font-semibold mb-2">SpicyHealth</p>
          <p className="text-sm text-charcoal-light italic">
            Gut essen. Grossartig fühlen. Deinen Stil leben. 💛
          </p>
          <p className="text-xs text-charcoal-light mt-1">
            Von Frauen für Frauen — für ein genussvolles, buntes Leben.
          </p>
        </div>
        <div className="flex justify-center gap-6 mb-4 text-xs text-charcoal-light">
          <Link href="/datenschutz" className="hover:text-regency transition-colors">Datenschutz</Link>
          <Link href="/impressum" className="hover:text-regency transition-colors">Impressum</Link>
          <Link href="/feedback" className="hover:text-regency transition-colors">Rückmeldung</Link>
        </div>
        <p className="text-center text-xs text-charcoal-light">
          © {new Date().getFullYear()} nice'n'easy — Cloud, AI & Automation
        </p>
      </div>
    </footer>
  );
}
