import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-rose-light bg-cream-dark mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-charcoal-light">
          <p className="font-heading text-regency font-semibold">SpicyHealth</p>
          <p>Gut essen. Grossartig fühlen. Deinen Stil leben.</p>
          <p>© {new Date().getFullYear()} nice'n'easy</p>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-xs text-charcoal-light">
          <Link href="/datenschutz" className="hover:text-regency transition-colors">Datenschutz</Link>
          <Link href="/impressum" className="hover:text-regency transition-colors">Impressum</Link>
          <Link href="/feedback" className="hover:text-regency transition-colors">Feedback</Link>
        </div>
      </div>
    </footer>
  );
}
