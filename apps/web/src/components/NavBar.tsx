'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

const navLinks = [
  { href: '/recipes',       label: 'Rezepte' },
  { href: '/meal-planner',  label: 'Mahlzeitenplaner' },
  { href: '/shopping-list', label: 'Einkaufsliste' },
];

const authNavLinks = [
  { href: '/profile', label: 'Profil' },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-blush">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-terracotta tracking-tight">
          SpicyHealth
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-charcoal-light hover:text-terracotta transition-colors">
              {label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-charcoal-light">{user?.displayName || user?.email}</span>
              {authNavLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="text-sm font-medium text-charcoal-light hover:text-terracotta transition-colors">
                  {label}
                </Link>
              ))}
              <Link href="/recipes/new" className="btn-secondary text-sm">+ Rezept</Link>
              <button onClick={logout} className="btn-ghost text-sm">Abmelden</button>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm">Anmelden</Link>
          )}
        </nav>

        <button className="md:hidden p-2 rounded-xl hover:bg-blush-light transition-colors" onClick={() => setOpen(!open)} aria-label="Menü umschalten">
          <span className="block w-5 h-0.5 bg-charcoal mb-1" />
          <span className="block w-5 h-0.5 bg-charcoal mb-1" />
          <span className="block w-5 h-0.5 bg-charcoal" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-blush bg-cream px-4 py-4 flex flex-col gap-3">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-charcoal py-1" onClick={() => setOpen(false)}>{label}</Link>
          ))}
          {isAuthenticated ? (
            <>
              {authNavLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="text-sm font-medium text-charcoal py-1" onClick={() => setOpen(false)}>{label}</Link>
              ))}
              <button onClick={() => { logout(); setOpen(false); }} className="btn-ghost text-sm text-left mt-2">Abmelden</button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm text-center mt-2" onClick={() => setOpen(false)}>Anmelden</Link>
          )}
        </div>
      )}
    </header>
  );
}
