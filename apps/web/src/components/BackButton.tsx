'use client';

import { useRouter, usePathname } from 'next/navigation';

// Map sub-pages to their logical parent
function getParentPath(path: string): string | null {
  if (path.startsWith('/recipes/')) return '/recipes';
  if (path.startsWith('/umstyling')) return '/';
  if (path.startsWith('/outfit-galerie')) return '/umstyling';
  if (path.startsWith('/meal-planner')) return '/';
  if (path.startsWith('/shopping-list')) return '/';
  if (path.startsWith('/mein-tag')) return '/';
  if (path.startsWith('/saisonkalender')) return '/recipes';
  if (path.startsWith('/profile')) return '/';
  if (path.startsWith('/feedback')) return '/profile';
  if (path.startsWith('/fortschritt')) return '/mein-tag';
  if (path.startsWith('/datenschutz') || path.startsWith('/impressum')) return '/';
  return null;
}

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    const parent = getParentPath(pathname);
    if (parent) {
      router.push(parent);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      style={{
        position: 'fixed',
        top: '12px',
        left: '12px',
        zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid #d4b896',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '18px',
        color: '#8b6f47',
      }}
      aria-label="Zurück"
    >
      ←
    </button>
  );
}
