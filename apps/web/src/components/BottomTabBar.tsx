'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const TABS = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/recipes', icon: '📖', label: 'Recipes' },
  { href: '/meal-planner', icon: '📅', label: 'Planner' },
  { href: '/shopping-list', icon: '🛒', label: 'List' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export function BottomTabBar() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-cream-200 flex">
      {TABS.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
              active ? 'text-terracotta-500' : 'text-charcoal-400 hover:text-charcoal-700'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-terracotta-500' : ''}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
