---
description: Import a recipe into SpicyHealth from a natural-language description
---

# Recipe Import Skill

You are importing a recipe into the SpicyHealth app. The user will describe a recipe in natural language (possibly in German or English). Your job is to:

1. **Parse** the description into the SpicyHealth recipe JSON schema
2. **Estimate** nutrition values per ingredient (calories, proteinG, carbsG, fatG, fiberG)
3. **Estimate** costs in CHF per ingredient
4. **Create** the recipe via the production API
5. **Verify** the recipe was stored correctly by fetching it back

## Recipe Schema

```json
{
  "title": "string (max 200)",
  "description": "string (max 1000) — short, appetizing German description",
  "category": "breakfast | lunch | dinner | snack | dessert | smoothie",
  "prepTimeMinutes": "number",
  "cookTimeMinutes": "number",
  "servings": "number",
  "tags": ["string array — e.g. glutenfrei, vegan, low-carb, schnell"],
  "ingredients": [
    {
      "name": "string — German, proper UTF-8 (ä ö ü allowed)",
      "quantity": "number",
      "unit": "string — g, ml, EL, TL, Stück, Bund, Prise, etc.",
      "calories": "number — kcal for this quantity",
      "proteinG": "number",
      "carbsG": "number",
      "fatG": "number",
      "fiberG": "number",
      "estimatedCostEur": "number — estimated CHF cost (field name is legacy)"
    }
  ],
  "instructions": ["string array — each step in German, imperative form"],
  "estimatedCostEur": "number — total estimated CHF cost"
}
```

## Steps

### Step 1: Write recipe JSON to a temp file

Write the complete recipe JSON to `tmp_recipe_import.json` in the project root. Use proper UTF-8 encoding with German umlauts (ä, ö, ü). Do NOT use ß — use "ss" instead (Swiss German convention).

### Step 2: Login and create via API

```bash
TOKEN=$(curl -s -X POST https://spicyhealth-api-prod.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"franziska.ulrich@niceneasy.ch","password":"Gummischuh1*"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST https://spicyhealth-api-prod.azurewebsites.net/api/recipes \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Authorization: Bearer $TOKEN" \
  --data-binary @tmp_recipe_import.json
```

### Step 3: Verify by fetching back

Fetch the created recipe by ID and confirm:
- Title and description are correct
- Nutrition macros are non-zero
- UTF-8 characters (ä ö ü) are preserved
- All ingredients are present

### Step 4: Clean up

Delete the temp JSON file.

### Step 5: Report

Show the user:
- Recipe title
- Nutrition summary (kcal, protein, carbs, fat per serving)
- Estimated cost in CHF
- Number of ingredients and steps

## Notes

- All text should be in German (Swiss style — no ß)
- Nutrition values should be realistic estimates based on common food databases
- Cost estimates should reflect Swiss grocery prices (Migros/Coop level)
- The `estimatedCostEur` field name is legacy but stores CHF values
- Always use `--data-binary` with `@file` to preserve UTF-8 encoding
- $arguments contains the recipe description from the user
