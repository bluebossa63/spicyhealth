'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

const navLinks = [
  { href: '/recipes',       label: 'Recipes' },
  { href: '/meal-planner',  label: 'Meal Planner' },
  { href: '/shopping-list', label: 'Shopping List' },
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
              <button onClick={logout} className="btn-ghost text-sm">Log out</button>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm">Sign in</Link>
          )}
        </nav>

        <button className="md:hidden p-2 rounded-xl hover:bg-blush-light transition-colors" onClick={() => setOpen(!open)} aria-label="Toggle menu">
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
            <button onClick={() => { logout(); setOpen(false); }} className="btn-ghost text-sm text-left mt-2">Log out</button>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm text-center mt-2" onClick={() => setOpen(false)}>Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}
