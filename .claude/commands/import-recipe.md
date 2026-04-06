---
description: Import a recipe into SpicyHealth from a natural-language description, with automatic photo from Unsplash
---

# Recipe Import Skill

Du importierst ein Rezept in die SpicyHealth App. Der Input ($arguments) ist eine Rezeptbeschreibung auf Deutsch oder Englisch. Gehe diese Schritte der Reihe nach durch:

---

## Schritt 1 — Secrets laden

```bash
source ~/.openclaw-secrets
```

Stelle sicher dass `SPICYHEALTH_EMAIL`, `SPICYHEALTH_PASSWORD`, und `SPICYHEALTH_API` gesetzt sind.

---

## Schritt 2 — Rezept-JSON erstellen

Wandle die Beschreibung in das SpicyHealth-Schema um. Schreibe das JSON nach `tmp_recipe_import.json` im Projektordner.

**Schema:**
```json
{
  "title": "string (max 200) — Deutsch, mit Umlauten",
  "description": "string (max 1000) — kurze, appetitliche Beschreibung auf Deutsch",
  "category": "breakfast | lunch | dinner | snack | dessert | smoothie",
  "prepTimeMinutes": 0,
  "cookTimeMinutes": 0,
  "servings": 4,
  "tags": ["vegan", "glutenfrei", "low-carb", "schnell", "etc."],
  "ingredients": [
    {
      "name": "Zutatenname auf Deutsch — Umlaute erlaubt (ä ö ü), kein ss statt ß erlaubt",
      "quantity": 200,
      "unit": "g | ml | EL | TL | Stueck | Bund | Prise | Stk",
      "calories": 150,
      "proteinG": 5.0,
      "carbsG": 20.0,
      "fatG": 3.0,
      "fiberG": 2.0,
      "estimatedCostEur": 1.20
    }
  ],
  "instructions": [
    "Schritt 1 auf Deutsch im Imperativ.",
    "Schritt 2 auf Deutsch im Imperativ."
  ],
  "estimatedCostEur": 8.50
}
```

**Wichtig:**
- Alle Texte auf Deutsch (Schweizer Stil — kein ß, stattdessen ss)
- Nährwerte realistisch schätzen (pro angegebene Menge der Zutat)
- Kosten in CHF schätzen (Migros/Coop-Niveau)
- `estimatedCostEur` = Gesamtkosten pro Rezept (Feld heisst legacy so, Wert ist CHF)

---

## Schritt 3 — Login und Token holen

```bash
source ~/.openclaw-secrets
TOKEN=$(curl -s -X POST "$SPICYHEALTH_API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SPICYHEALTH_EMAIL\",\"password\":\"$SPICYHEALTH_PASSWORD\"}" \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:20}..."
```

---

## Schritt 4 — Foto von Unsplash holen und hochladen

```bash
source ~/.openclaw-secrets

# 1. Suchanfrage aus Rezepttitel ableiten (englisches Keyword besser für Unsplash)
SEARCH_TERM="healthy food recipe"  # ersetze mit passendem englischem Begriff

# 2. Foto-URL von Unsplash holen (falls API-Key vorhanden)
if [ -n "$UNSPLASH_ACCESS_KEY" ]; then
  PHOTO_URL=$(curl -s "https://api.unsplash.com/search/photos?query=${SEARCH_TERM}&per_page=1&orientation=landscape" \
    -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY" \
    | grep -o '"regular":"[^"]*"' | head -1 | cut -d'"' -f4)
else
  # Fallback: Pexels-ähnliche freie URL (kein Key nötig)
  PHOTO_URL=""
fi

# 3. Falls URL gefunden: Bild herunterladen
if [ -n "$PHOTO_URL" ]; then
  curl -sL "$PHOTO_URL" -o tmp_recipe_photo.jpg

  # 4. SAS Upload-URL vom API holen
  UPLOAD_RESP=$(curl -s -X POST "$SPICYHEALTH_API/api/recipes/upload-image" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"filename":"recipe.jpg","contentType":"image/jpeg"}')

  UPLOAD_URL=$(echo "$UPLOAD_RESP" | grep -o '"uploadUrl":"[^"]*"' | cut -d'"' -f4)
  PUBLIC_URL=$(echo "$UPLOAD_RESP" | grep -o '"publicUrl":"[^"]*"' | cut -d'"' -f4)

  # 5. Foto zu Azure Blob hochladen
  curl -s -X PUT "$UPLOAD_URL" \
    -H "x-ms-blob-type: BlockBlob" \
    -H "Content-Type: image/jpeg" \
    --data-binary @tmp_recipe_photo.jpg

  echo "Foto hochgeladen: $PUBLIC_URL"

  # 6. imageUrl ins JSON einfügen (mit Python, da bash JSON-Manipulation schwierig)
  python3 -c "
import json, sys
with open('tmp_recipe_import.json') as f:
    r = json.load(f)
r['imageUrl'] = '$PUBLIC_URL'
with open('tmp_recipe_import.json', 'w', encoding='utf-8') as f:
    json.dump(r, f, ensure_ascii=False, indent=2)
print('imageUrl gesetzt.')
"
else
  echo "Kein Foto gefunden — Rezept wird ohne Bild importiert."
fi
```

---

## Schritt 5 — Rezept via API anlegen

```bash
source ~/.openclaw-secrets
RESULT=$(curl -s -X POST "$SPICYHEALTH_API/api/recipes" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Authorization: Bearer $TOKEN" \
  --data-binary @tmp_recipe_import.json)

RECIPE_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Erstellt: $RECIPE_ID"
echo "$RESULT"
```

---

## Schritt 6 — Verifizieren

```bash
source ~/.openclaw-secrets
curl -s "$SPICYHEALTH_API/api/recipes/$RECIPE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import json, sys
r = json.load(sys.stdin)['recipe']
print(f\"Titel: {r['title']}\")
print(f\"Kategorie: {r['category']}\")
print(f\"Bild: {r.get('imageUrl','(keins)')}\")
print(f\"Zutaten: {len(r['ingredients'])}\")
print(f\"Schritte: {len(r['instructions'])}\")
if r['nutrition']:
    n = r['nutrition']
    print(f\"Kalorien/Portion: {n.get('calories',0):.0f} kcal\")
    print(f\"Protein: {n.get('proteinG',0):.1f}g  Carbs: {n.get('carbsG',0):.1f}g  Fett: {n.get('fatG',0):.1f}g\")
print(f\"Kosten: CHF {r.get('estimatedCostEur',0):.2f}\")
"
```

---

## Schritt 7 — Aufräumen

```bash
rm -f tmp_recipe_import.json tmp_recipe_photo.jpg
```

---

## Schritt 8 — Zusammenfassung

Zeige der Nutzerin:
- Rezepttitel und Kategorie
- Nährwerte pro Portion (kcal, Protein, Carbs, Fett)
- Geschätzte Kosten in CHF
- Anzahl Zutaten und Schritte
- Ob ein Foto gefunden wurde
- Link: https://spicyhealth.niceneasy.ch/recipes/[ID]
