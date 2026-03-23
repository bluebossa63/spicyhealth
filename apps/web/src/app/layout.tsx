import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/auth';
import { BottomTabBar } from '@/components/BottomTabBar';
import { InstallBanner } from '@/components/InstallBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'SpicyHealth', template: '%s | SpicyHealth' },
  description: 'Gesunde Ernährung & Lifestyle-Rezepte, Mahlzeitenplanung und Nährwert-Tracking',
  manifest: '/manifest.json',
  themeColor: '#7b9eb8',
  viewport: { width: 'device-width', initialScale: 1 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col bg-cream font-body text-charcoal">
        <AuthProvider>
          <ErrorBoundary>
            <NavBar />
            <main className="flex-1 pb-16 md:pb-0">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <BottomTabBar />
            <InstallBanner />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
