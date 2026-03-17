'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(fd.get('email') as string, fd.get('password') as string);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl text-center text-charcoal mb-2">Welcome back</h1>
        <p className="text-center text-charcoal-light text-sm mb-8">Sign in to your SpicyHealth account</p>

        <Card>
          {/* Social login buttons (deferred — S1-03/04/05) */}
          <div className="flex flex-col gap-3 mb-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center justify-center gap-3 border border-blush rounded-xl px-4 py-2.5 text-sm font-medium text-charcoal-light">
              Social login coming soon
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-blush" />
            <span className="text-xs text-charcoal-light">or</span>
            <div className="flex-1 h-px bg-blush" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" name="email" placeholder="you@example.com" required />
            <Input label="Password" type="password" name="password" placeholder="••••••••" required />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-charcoal-light mt-5">
            No account yet?{' '}
            <Link href="/auth/register" className="text-terracotta font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
