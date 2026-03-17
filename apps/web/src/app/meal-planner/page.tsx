import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MealPlannerPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="font-heading text-3xl text-terracotta mb-6">Meal Planner</h2>
        <p className="text-charcoal-light">Drag-and-drop planner coming in Sprint 4.</p>
      </main>
    </ProtectedRoute>
  );
}
