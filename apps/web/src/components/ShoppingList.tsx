import type { ShoppingListItem } from '@spicyhealth/shared';

interface Props {
  items: ShoppingListItem[];
  onToggle?: (itemId: string) => void;
}

export function ShoppingList({ items, onToggle }: Props) {
  if (items.length === 0) {
    return <p style={{ color: '#aaa' }}>No items yet. Generate from your meal plan.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0',
            borderBottom: '1px solid #f0ece8',
            textDecoration: item.purchased ? 'line-through' : 'none',
            color: item.purchased ? '#bbb' : '#3a3a3a',
          }}
        >
          <input
            type="checkbox"
            checked={item.purchased}
            onChange={() => onToggle?.(item.ingredient.openFoodFactsId ?? String(i))}
          />
          <span>
            {item.ingredient.quantity} {item.ingredient.unit} {item.ingredient.name}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#aaa' }}>
            {item.category}
          </span>
        </li>
      ))}
    </ul>
  );
}
