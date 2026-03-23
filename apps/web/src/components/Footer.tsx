export function Footer() {
  return (
    <footer className="border-t border-rose-light bg-cream-dark mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-charcoal-light">
        <p className="font-heading text-regency font-semibold">SpicyHealth</p>
        <p>Gut essen. Großartig fühlen. Vollständig leben.</p>
        <p>© {new Date().getFullYear()} SpicyHealth</p>
      </div>
    </footer>
  );
}
