'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) { router.replace('/'); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/recipes');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-cream-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🌿</span>
          <h1 className="font-display text-3xl text-charcoal-800 mt-2">Welcome back</h1>
          <p className="text-charcoal-400 text-sm mt-1">Sign in to your SpicyHealth account</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-charcoal-500 mt-4">
          No account?{' '}
          <Link href="/auth/register" className="text-terracotta-500 hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </main>
  );
}
