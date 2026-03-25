'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
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
