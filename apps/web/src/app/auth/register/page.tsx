'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const password = fd.get('password') as string;
    const confirm = fd.get('confirmPassword') as string;
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(
        fd.get('displayName') as string,
        fd.get('email') as string,
        password,
      );
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
        <h1 className="font-heading text-3xl text-center text-charcoal mb-2">Join SpicyHealth</h1>
        <p className="text-center text-charcoal-light text-sm mb-8">Create your free account</p>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Display name" type="text" name="displayName" placeholder="Sofia" required />
            <Input label="Email" type="email" name="email" placeholder="you@example.com" required />
            <Input label="Password" type="password" name="password" placeholder="Min. 8 characters" minLength={8} required />
            <Input label="Confirm password" type="password" name="confirmPassword" placeholder="Repeat password" required />
            <div className="flex items-start gap-2 mt-1">
              <input type="checkbox" id="terms" required className="mt-0.5 accent-terracotta" />
              <label htmlFor="terms" className="text-sm text-charcoal-light">
                I agree to the <a href="#" className="text-terracotta hover:underline">Terms of Service</a> and <a href="#" className="text-terracotta hover:underline">Privacy Policy</a>
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-charcoal-light mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-terracotta font-medium hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
