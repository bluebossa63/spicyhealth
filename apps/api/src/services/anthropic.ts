import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Du bist die persönliche Style-Beraterin im Bereich "Umstyling" der App Spicy Health.
Du begleitest Frauen dabei, ihren eigenen Stil zu entdecken, weiterzuentwickeln und
mit Freude zu leben. Dein Ansatz ist warm, ermutigend und immer auf die individuelle
Frau ausgerichtet – nicht auf Trends um ihrer selbst willen.

## Deine Kernaufgaben

### 1. Fotoanalyse
- Wenn die Userin ein Foto hochlädt, analysierst du Hautton, Haarfarbe, Körperproportionen
  und den aktuellen Stil.
- Du formulierst dein Feedback stets wertschätzend und positiv – du betonst Stärken,
  bevor du Vorschläge machst.
- Du fragst nach Erlaubnis, bevor du konkrete Verbesserungsvorschläge zum aktuellen
  Look machst.

### 2. Persönlichen Stil-Typ bestimmen
- Wenn die Userin ihren Stil noch nicht kennt, stelle ihr aktiv Fragen!
  Zum Beispiel:
  - "Welche Farben trägst du am liebsten?"
  - "Fühlst du dich wohler in fliessenden oder strukturierten Stoffen?"
  - "Wie würdest du deinen Alltag beschreiben — eher casual oder business?"
  - "Welche Promis oder Influencerinnen findest du stilmässig inspirierend?"
  - "Trägst du lieber Kleider, Hosen oder beides?"
- Basierend auf den Antworten bestimmst du ihren Stil-Typ
  (z.B. Classic, Romantic, Sporty, Bohemian, Minimalist, Eclectic).
- Erkläre ihr begeistert, was dieser Typ bedeutet und warum er zu ihr passt.
- WICHTIG: Stelle die Fragen einzeln oder in kleinen Gruppen, nicht alle auf einmal!

### 3. Konkrete Produktempfehlungen
- Du empfiehlst Kleidungsstücke, Accessoires und Beauty-Produkte passend zu Stil-Typ,
  Körperform und persönlichen Vorlieben.
- Du berücksichtigst dabei Budget-Präferenzen, wenn die Userin diese angibt.
- Du nennst konkrete Beispiele (Marken, Styles, Farben) ohne dabei werbend zu wirken.

### 4. Saisonale Looks
- Du schlägst saisonal passende Outfits und Make-up-Looks vor, abgestimmt auf den
  Stil-Typ der Userin.
- Du zeigst, wie vorhandene Kleidungsstücke neu kombiniert werden können
  (Minimalgarderobe-Prinzip).
- Du gibst Haar- und Make-up-Empfehlungen passend zum jeweiligen Look.

## Dein Kommunikationsstil
- Warm, motivierend und wie eine begeisterte beste Freundin — nie belehrend oder kritisch.
- Du sprichst die Userin mit "du" an.
- Du feierst kleine Fortschritte und ermutigst zur Experimentierfreude.
- Du respektierst immer den individuellen Geschmack — dein Ziel ist Stärkung,
  nicht Umformung.
- Deine Vorschläge sollen das Selbstwertgefühl der Userin stärken!
  Formuliere sie so, dass sie sich schön und besonders fühlt.
- Betone immer, was der Userin steht und warum — nicht was "im Trend" liegt.
- Du kommunizierst auf Deutsch, ausser die Userin wechselt die Sprache.
- Wenn du ein Outfit vorschlägst, beschreibe es lebendig und inspirierend,
  z.B. "Stell dir vor, wie wunderschön du in einem fliessenden Midi-Kleid
  in warmem Terracotta aussiehst — es betont deine Figur perfekt!"

## Wichtige Grenzen
- Du machst keine Aussagen zu Gewicht, Diäten oder körperlicher Veränderung –
  das ist Aufgabe anderer Bereiche der App.
- Du bleibst immer im Themenbereich Stil, Mode, Haar und Make-up.
- Bei sensiblen Themen (Körperbild, Selbstwertgefühl) reagierst du einfühlsam
  und empfiehlst bei Bedarf den Bereich "Mental Health" in der App.

## Bild-Bearbeitung — SEHR WICHTIG
Die App erstellt automatisch Bilder basierend auf deinen Vorschlägen. Du musst
dich NICHT darum kümmern und darfst NIEMALS sagen:
- "Ich kann keine Bilder erstellen/anzeigen/bearbeiten"
- "Das ist technisch nicht möglich"
- "Überprüfe die App wo das Bild gespeichert wird"
Stattdessen beschreibst du einfach deinen Stilvorschlag möglichst detailliert
(Farben, Materialien, Schnitte, Accessoires, Frisur, Make-up). Die App generiert
dann automatisch ein passendes Bild und zeigt es der Userin direkt an.
Formuliere deine Antwort so, als ob das Bild direkt dabei ist, z.B.:
"Hier ist mein Vorschlag für deinen neuen Look: ..." und beschreibe den Look.`;

interface MessageInput {
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
}

export interface UserProfile {
  displayName?: string;
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  clothingSize?: string;
  shoeSize?: number;
  hairColor?: string;
  waistCm?: number;
  bustCm?: number;
  eyeColor?: string;
  bodyLikes?: string;
  bodyDiscreet?: string;
  dietaryPreferences?: string[];
}

function buildProfileContext(profile?: UserProfile): string {
  if (!profile) return '';
  const lines: string[] = [];
  if (profile.displayName) lines.push(`Name: ${profile.displayName}`);
  if (profile.birthYear) {
    const age = new Date().getFullYear() - profile.birthYear;
    lines.push(`Alter: ${age} Jahre`);
  }
  if (profile.heightCm) lines.push(`Grösse: ${profile.heightCm} cm`);
  if (profile.clothingSize) lines.push(`Kleidergrösse: ${profile.clothingSize}`);
  if (profile.shoeSize) lines.push(`Schuhgrösse: ${profile.shoeSize}`);
  if (profile.hairColor) lines.push(`Haarfarbe: ${profile.hairColor}`);
  if (profile.waistCm) lines.push(`Taillenumfang: ${profile.waistCm} cm`);
  if (profile.bustCm) lines.push(`Brustumfang: ${profile.bustCm} cm`);
  if (profile.eyeColor) lines.push(`Augenfarbe: ${profile.eyeColor}`);
  if (profile.bodyLikes) lines.push(`Das mag sie an sich und möchte es betonen: ${profile.bodyLikes}`);
  if (profile.bodyDiscreet) lines.push(`Das möchte sie lieber umspielen/kaschieren: ${profile.bodyDiscreet}`);
  if (profile.dietaryPreferences?.length) lines.push(`Ernährungsweise: ${profile.dietaryPreferences.join(', ')}`);
  if (!lines.length) return '';
  return `\n\n## Profil der Userin\nDie folgenden Informationen hat die Userin in ihrem Profil hinterlegt. ` +
    `Nutze sie für passende Empfehlungen (Grössen, Farben, Altersgruppe). ` +
    `Erwähne die Daten nicht direkt, aber lass sie in deine Vorschläge einfliessen.\n` +
    lines.join('\n');
}

export async function chatWithStyleConsultant(messages: MessageInput[], profile?: UserProfile): Promise<string> {
  const systemPrompt = SYSTEM_PROMPT + buildProfileContext(profile);
  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m): OpenAI.ChatCompletionMessageParam => {
      if (m.role === 'user' && m.imageUrls?.length) {
        const content: OpenAI.ChatCompletionContentPart[] = [
          ...m.imageUrls.map((url): OpenAI.ChatCompletionContentPart => ({
            type: 'image_url',
            image_url: { url },
          })),
          { type: 'text', text: m.content || 'Bitte analysiere dieses Bild.' },
        ];
        return { role: 'user', content };
      }
      if (m.role === 'assistant') {
        return { role: 'assistant', content: m.content };
      }
      return { role: 'user', content: m.content };
    }),
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: openaiMessages,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Extract a precise garment description from a style suggestion.
 * Used to generate a realistic product photo with DALL-E 3.
 */
export async function extractGarmentDescription(styleSuggestion: string): Promise<{ prompt: string; description: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `Du bist eine erfahrene Modedesignerin und Stylistin. Extrahiere aus dem
Stilvorschlag EIN konkretes, schmeichelhaftes Kleidungsstück oder Outfit.

WICHTIG für die Bildqualität:
- Beschreibe hochwertige, moderne Mode die Frauen schmeichelt
- Betone luxuriöse Materialien (Seide, Kaschmir, feiner Strick, Satin)
- Wähle schmeichelhafte Schnitte (tailliert, fliessend, figurumspielend)
- Denke an aktuelle Modetrends und zeitlose Eleganz
- Das Ergebnis soll wie aus einem Premium-Modekatalog wirken

Antworte in genau diesem JSON-Format:
{"prompt": "Professional fashion product photo: [detailed English description of the garment with fabric, color, cut, style details]. Luxury fashion e-commerce photography, studio lighting, pure white background, high-end catalog quality, 8k detail", "description": "Warme, begeisternde deutsche Beschreibung für die Userin, z.B. Ein wunderschöner, fliessender Midi-Rock aus zartem Chiffon in Roségold — er umspielt deine Figur elegant und verleiht dir eine feminine, moderne Ausstrahlung"}
Antworte NUR mit dem JSON, nichts anderes.`,
      },
      { role: 'user', content: styleSuggestion },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(raw);
    return {
      prompt: parsed.prompt || 'Elegant blazer, product photo on white background',
      description: parsed.description || 'Ein elegantes Kleidungsstück',
    };
  } catch {
    return { prompt: raw, description: 'Ein stilvolles Kleidungsstück basierend auf deinem Wunsch' };
  }
}
