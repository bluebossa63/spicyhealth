import type { Recipe } from '@spicyhealth/shared';

interface Props {
  recipe: Recipe;
  onQuickAdd?: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onQuickAdd }: Props) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '1.25rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }}
        />
      )}
      <h3 style={{ margin: 0, color: '#3a3a3a' }}>{recipe.title}</h3>
      <p style={{ margin: 0, color: '#888', fontSize: '0.875rem' }}>{recipe.description}</p>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#aaa' }}>
        <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
        <span>{recipe.nutrition.calories} kcal</span>
        <span>€{recipe.estimatedCostEur.toFixed(2)}</span>
      </div>
      {onQuickAdd && (
        <button
          onClick={() => onQuickAdd(recipe)}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#d4856a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Quick Add for Today
        </button>
      )}
    </div>
  );
}
