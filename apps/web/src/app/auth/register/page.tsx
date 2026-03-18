'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) { router.replace('/'); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(displayName, email, password);
      router.replace('/recipes');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-cream-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🌿</span>
          <h1 className="font-display text-3xl text-charcoal-800 mt-2">Create account</h1>
          <p className="text-charcoal-400 text-sm mt-1">Join SpicyHealth today</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Your name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required className="input-field" placeholder="Maria" autoComplete="name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Password <span className="text-charcoal-400 font-normal">(min. 8 chars)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="input-field" placeholder="••••••••" autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-sm text-charcoal-500 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-terracotta-500 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
