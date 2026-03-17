import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    icon: '🥗',
    title: 'Recipe Library',
    description: 'Hundreds of healthy recipes with full nutrition info and cost breakdown.',
    href: '/recipes',
  },
  {
    icon: '📅',
    title: 'Meal Planner',
    description: 'Plan your week with a beautiful drag-and-drop planner.',
    href: '/meal-planner',
  },
  {
    icon: '🛒',
    title: 'Smart Shopping',
    description: 'Auto-generate your shopping list from the weekly meal plan.',
    href: '/shopping-list',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-4">
          Eat well.<br />
          <span className="text-terracotta">Feel great.</span>
        </h1>
        <p className="text-lg text-charcoal-light max-w-xl mx-auto mb-8">
          Healthy recipes, weekly meal planning, nutrition tracking, and smart shopping — all in one beautiful app.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/recipes"><Button size="lg">Explore Recipes</Button></Link>
          <Link href="/auth/register"><Button size="lg" variant="ghost">Get started free</Button></Link>
        </div>
      </section>

      {/* Placeholder lifestyle image strip */}
      <section className="w-full h-64 bg-gradient-to-r from-blush-light via-cream-dark to-sage-light flex items-center justify-center mb-16">
        <p className="text-charcoal-light text-sm italic">[ Lifestyle photography ]</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-3xl text-center text-charcoal mb-10">Everything you need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon, title, description, href }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full group-hover:shadow-card-hover transition-shadow text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">{title}</h3>
                <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
