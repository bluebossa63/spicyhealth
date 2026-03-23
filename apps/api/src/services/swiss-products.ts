// Common Swiss grocery products with nutrition per 100g/100ml
// Covers Coop, Migros, Lidl, Aldi, Denner products

export interface SwissProduct {
  name: string;
  brand: string;
  category: string;
  per100g: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
}

export const SWISS_PRODUCTS: SwissProduct[] = [
  // === MILCH ===
  { name: 'Vollmilch 3.5%', brand: 'M-Classic (Migros)', category: 'milch', per100g: { calories: 64, proteinG: 3.3, carbsG: 4.7, fatG: 3.5, fiberG: 0 } },
  { name: 'Milch Drink 2.5%', brand: 'M-Classic (Migros)', category: 'milch', per100g: { calories: 50, proteinG: 3.3, carbsG: 4.8, fatG: 2.5, fiberG: 0 } },
  { name: 'Milch fettarm 1.5%', brand: 'Coop Prix Garantie', category: 'milch', per100g: { calories: 47, proteinG: 3.4, carbsG: 4.9, fatG: 1.5, fiberG: 0 } },
  { name: 'Magermilch 0.1%', brand: 'Coop', category: 'milch', per100g: { calories: 35, proteinG: 3.5, carbsG: 4.9, fatG: 0.1, fiberG: 0 } },
  { name: 'Good Day Milch fettarm', brand: 'Lidl', category: 'milch', per100g: { calories: 46, proteinG: 3.3, carbsG: 4.8, fatG: 1.5, fiberG: 0 } },
  { name: 'Milch fettarm UHT', brand: 'Aldi Milfina', category: 'milch', per100g: { calories: 46, proteinG: 3.3, carbsG: 4.8, fatG: 1.5, fiberG: 0 } },
  { name: 'Bio Vollmilch', brand: 'Coop Naturaplan', category: 'milch', per100g: { calories: 65, proteinG: 3.3, carbsG: 4.7, fatG: 3.8, fiberG: 0 } },
  { name: 'Laktosefreie Milch', brand: 'Coop Free From', category: 'milch', per100g: { calories: 47, proteinG: 3.3, carbsG: 4.8, fatG: 1.5, fiberG: 0 } },

  // === PFLANZENMILCH ===
  { name: 'Haferdrink', brand: 'Oatly', category: 'milch', per100g: { calories: 45, proteinG: 0.3, carbsG: 6.7, fatG: 1.5, fiberG: 0.8 } },
  { name: 'Mandeldrink ungesüsst', brand: 'Alpro', category: 'milch', per100g: { calories: 13, proteinG: 0.4, carbsG: 0, fatG: 1.1, fiberG: 0.4 } },
  { name: 'Sojadrink', brand: 'Alpro', category: 'milch', per100g: { calories: 33, proteinG: 3.3, carbsG: 0.2, fatG: 1.8, fiberG: 0.5 } },
  { name: 'Kokosmilch (Dose)', brand: 'Thai Kitchen', category: 'milch', per100g: { calories: 187, proteinG: 1.8, carbsG: 3, fatG: 19, fiberG: 0 } },

  // === JOGHURT & QUARK ===
  { name: 'Griechischer Joghurt 0%', brand: 'Coop', category: 'joghurt', per100g: { calories: 57, proteinG: 10, carbsG: 4, fatG: 0, fiberG: 0 } },
  { name: 'Griechischer Joghurt 10%', brand: 'Total', category: 'joghurt', per100g: { calories: 130, proteinG: 7, carbsG: 4, fatG: 10, fiberG: 0 } },
  { name: 'Magerquark', brand: 'M-Classic (Migros)', category: 'joghurt', per100g: { calories: 67, proteinG: 12, carbsG: 4, fatG: 0.2, fiberG: 0 } },
  { name: 'Naturjoghurt 3.5%', brand: 'Emmi', category: 'joghurt', per100g: { calories: 63, proteinG: 3.4, carbsG: 4.5, fatG: 3.5, fiberG: 0 } },
  { name: 'Skyr', brand: 'Emmi', category: 'joghurt', per100g: { calories: 63, proteinG: 11, carbsG: 4, fatG: 0.2, fiberG: 0 } },
  { name: 'Proteinjoghurt', brand: 'Emmi Energy Milk', category: 'joghurt', per100g: { calories: 56, proteinG: 8.5, carbsG: 4.5, fatG: 0.2, fiberG: 0 } },

  // === KAESE ===
  { name: 'Emmentaler', brand: 'Migros', category: 'kaese', per100g: { calories: 380, proteinG: 28, carbsG: 0, fatG: 30, fiberG: 0 } },
  { name: 'Mozzarella', brand: 'Galbani', category: 'kaese', per100g: { calories: 253, proteinG: 18, carbsG: 1, fatG: 19, fiberG: 0 } },
  { name: 'Feta', brand: 'Coop', category: 'kaese', per100g: { calories: 264, proteinG: 14, carbsG: 4, fatG: 21, fiberG: 0 } },
  { name: 'Cottage Cheese', brand: 'M-Classic (Migros)', category: 'kaese', per100g: { calories: 92, proteinG: 11, carbsG: 3.4, fatG: 4.3, fiberG: 0 } },
  { name: 'Hüttenkäse light', brand: 'Coop', category: 'kaese', per100g: { calories: 72, proteinG: 12, carbsG: 2.5, fatG: 1.8, fiberG: 0 } },

  // === BROT & GETREIDE ===
  { name: 'Haferflocken', brand: 'M-Classic (Migros)', category: 'getreide', per100g: { calories: 375, proteinG: 13, carbsG: 63, fatG: 7, fiberG: 10 } },
  { name: 'Vollkornbrot', brand: 'Coop', category: 'brot', per100g: { calories: 220, proteinG: 8, carbsG: 38, fatG: 3, fiberG: 7 } },
  { name: 'Reiswaffeln', brand: 'M-Classic (Migros)', category: 'getreide', per100g: { calories: 387, proteinG: 8, carbsG: 82, fatG: 3, fiberG: 3 } },
  { name: 'Quinoa', brand: 'Coop Karma', category: 'getreide', per100g: { calories: 370, proteinG: 13, carbsG: 65, fatG: 6, fiberG: 7 } },
  { name: 'Basmatireis', brand: 'M-Classic (Migros)', category: 'getreide', per100g: { calories: 360, proteinG: 7, carbsG: 78, fatG: 1, fiberG: 1 } },
  { name: 'Vollkorn-Penne', brand: 'Barilla', category: 'getreide', per100g: { calories: 348, proteinG: 13, carbsG: 65, fatG: 3, fiberG: 10 } },

  // === PROTEINQUELLEN ===
  { name: 'Poulet-Brust', brand: 'Optigal (Migros)', category: 'fleisch', per100g: { calories: 110, proteinG: 23, carbsG: 0, fatG: 1.5, fiberG: 0 } },
  { name: 'Lachsfilet', brand: 'Coop', category: 'fisch', per100g: { calories: 208, proteinG: 20, carbsG: 0, fatG: 14, fiberG: 0 } },
  { name: 'Thunfisch (Dose, in Wasser)', brand: 'Rio Mare', category: 'fisch', per100g: { calories: 110, proteinG: 24, carbsG: 0, fatG: 1, fiberG: 0 } },
  { name: 'Eier (1 Stück, ca. 60g)', brand: 'Coop Naturafarm', category: 'ei', per100g: { calories: 143, proteinG: 12.5, carbsG: 0.7, fatG: 10, fiberG: 0 } },
  { name: 'Tofu', brand: 'Migros Bio', category: 'pflanzlich', per100g: { calories: 95, proteinG: 10, carbsG: 1.5, fatG: 5.5, fiberG: 0.2 } },
  { name: 'Rote Linsen', brand: 'M-Classic (Migros)', category: 'huelsenfruechte', per100g: { calories: 340, proteinG: 25, carbsG: 56, fatG: 1.5, fiberG: 11 } },
  { name: 'Kichererbsen (Dose)', brand: 'Coop', category: 'huelsenfruechte', per100g: { calories: 130, proteinG: 9, carbsG: 18, fatG: 2, fiberG: 6 } },
  { name: 'Edamame (tiefgekühlt)', brand: 'Coop Betty Bossi', category: 'huelsenfruechte', per100g: { calories: 122, proteinG: 11, carbsG: 8, fatG: 5, fiberG: 5 } },

  // === GEMUESE ===
  { name: 'Brokkoli', brand: 'frisch', category: 'gemuese', per100g: { calories: 34, proteinG: 2.8, carbsG: 5.2, fatG: 0.4, fiberG: 2.6 } },
  { name: 'Spinat (frisch)', brand: 'frisch', category: 'gemuese', per100g: { calories: 23, proteinG: 2.9, carbsG: 1.4, fatG: 0.4, fiberG: 2.2 } },
  { name: 'Süsskartoffel', brand: 'frisch', category: 'gemuese', per100g: { calories: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1, fiberG: 3 } },
  { name: 'Karotten', brand: 'frisch', category: 'gemuese', per100g: { calories: 41, proteinG: 0.9, carbsG: 9.5, fatG: 0.2, fiberG: 2.8 } },
  { name: 'Avocado', brand: 'frisch', category: 'gemuese', per100g: { calories: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 } },
  { name: 'Cherrytomaten', brand: 'frisch', category: 'gemuese', per100g: { calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2 } },

  // === FRUECHTE ===
  { name: 'Banane', brand: 'frisch', category: 'frucht', per100g: { calories: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, fiberG: 2.6 } },
  { name: 'Erdbeeren', brand: 'frisch', category: 'frucht', per100g: { calories: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fiberG: 2 } },
  { name: 'Blaubeeren', brand: 'frisch', category: 'frucht', per100g: { calories: 57, proteinG: 0.7, carbsG: 14.5, fatG: 0.3, fiberG: 2.4 } },
  { name: 'Mango', brand: 'frisch', category: 'frucht', per100g: { calories: 60, proteinG: 0.8, carbsG: 15, fatG: 0.4, fiberG: 1.6 } },
  { name: 'Apfel', brand: 'frisch', category: 'frucht', per100g: { calories: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, fiberG: 2.4 } },

  // === NUESSE & SAMEN ===
  { name: 'Mandeln', brand: 'Coop', category: 'nuesse', per100g: { calories: 579, proteinG: 21, carbsG: 4, fatG: 50, fiberG: 12.5 } },
  { name: 'Walnüsse', brand: 'Migros', category: 'nuesse', per100g: { calories: 654, proteinG: 15, carbsG: 7, fatG: 65, fiberG: 6.7 } },
  { name: 'Chiasamen', brand: 'Coop Karma', category: 'samen', per100g: { calories: 486, proteinG: 17, carbsG: 42, fatG: 31, fiberG: 34 } },
  { name: 'Leinsamen', brand: 'M-Classic (Migros)', category: 'samen', per100g: { calories: 534, proteinG: 18, carbsG: 3, fatG: 42, fiberG: 27 } },
  { name: 'Erdnussbutter (natürlich)', brand: 'Coop', category: 'nuesse', per100g: { calories: 588, proteinG: 25, carbsG: 13, fatG: 50, fiberG: 8 } },
  { name: 'Tahini', brand: 'Al Amira', category: 'nuesse', per100g: { calories: 590, proteinG: 17, carbsG: 6, fatG: 54, fiberG: 4 } },

  // === PROTEINPULVER & SUPPLEMENTS ===
  { name: 'Whey Protein Pulver', brand: 'Sponser', category: 'supplement', per100g: { calories: 380, proteinG: 80, carbsG: 5, fatG: 5, fiberG: 0 } },
  { name: 'Proteinpulver vegan', brand: 'Vega', category: 'supplement', per100g: { calories: 370, proteinG: 67, carbsG: 13, fatG: 5, fiberG: 3 } },

  // === OELE & FETTE ===
  { name: 'Olivenöl', brand: 'Bertolli', category: 'oel', per100g: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 } },
  { name: 'Kokosfett', brand: 'Coop', category: 'oel', per100g: { calories: 862, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 } },
  { name: 'Butter', brand: 'Die Butter (Migros)', category: 'fett', per100g: { calories: 717, proteinG: 0.7, carbsG: 0, fatG: 81, fiberG: 0 } },

  // === SUESSES ===
  { name: 'Honig', brand: 'Coop Naturaplan', category: 'suess', per100g: { calories: 304, proteinG: 0.3, carbsG: 82, fatG: 0, fiberG: 0 } },
  { name: 'Ahornsirup', brand: 'Coop', category: 'suess', per100g: { calories: 260, proteinG: 0, carbsG: 67, fatG: 0, fiberG: 0 } },
  { name: 'Dunkle Schokolade 70%', brand: 'Lindt Excellence', category: 'suess', per100g: { calories: 545, proteinG: 8, carbsG: 35, fatG: 41, fiberG: 11 } },
];

/**
 * Search local Swiss products by name. Fuzzy matching.
 */
export function searchSwissProducts(query: string): SwissProduct[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return SWISS_PRODUCTS
    .map(p => {
      const searchText = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      const matchCount = terms.filter(t => searchText.includes(t)).length;
      return { product: p, score: matchCount };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(r => r.product);
}
