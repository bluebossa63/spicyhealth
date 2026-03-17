import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl text-center text-charcoal mb-2">Join SpicyHealth</h1>
        <p className="text-center text-charcoal-light text-sm mb-8">Create your free account to get started</p>

        <Card>
          <form className="flex flex-col gap-4" action="/api/auth/register" method="POST">
            <Input label="Display name" type="text" name="displayName" placeholder="Sofia" required />
            <Input label="Email" type="email" name="email" placeholder="you@example.com" required />
            <Input label="Password" type="password" name="password" placeholder="Min. 8 characters" minLength={8} required />
            <Input label="Confirm password" type="password" name="confirmPassword" placeholder="Repeat password" required />

            <div className="flex items-start gap-2 mt-1">
              <input type="checkbox" id="terms" required className="mt-0.5 accent-terracotta" />
              <label htmlFor="terms" className="text-sm text-charcoal-light">
                I agree to the{' '}
                <a href="#" className="text-terracotta hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-terracotta hover:underline">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" className="w-full mt-2">Create account</Button>
          </form>

          <p className="text-center text-sm text-charcoal-light mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-terracotta font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
