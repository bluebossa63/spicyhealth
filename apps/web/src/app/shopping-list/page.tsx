import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ShoppingListPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="font-heading text-3xl text-terracotta mb-6">Shopping List</h2>
        <p className="text-charcoal-light">Smart shopping list coming soon.</p>
      </main>
    </ProtectedRoute>
  );
}
