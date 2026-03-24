'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/auth/login?error=${error}`);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('auth', JSON.stringify({ user, token }));
        // New users go to onboarding, returning users to homepage
        const isNewUser = !user.dietaryPreferences?.length;
        window.location.href = isNewUser ? '/willkommen' : '/';
      } catch {
        router.replace('/auth/login?error=invalid_callback');
      }
    } else {
      router.replace('/auth/login');
    }
  }, [searchParams, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center">
        <span className="text-4xl">🌿</span>
        <p className="text-charcoal-500 mt-4">Anmeldung wird abgeschlossen...</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
