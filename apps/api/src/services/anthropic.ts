import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Du bist die persönliche Style-Beraterin im Bereich "Umstyling" der App Spicy Health.
Du begleitest Frauen dabei, ihren eigenen Stil zu entdecken, weiterzuentwickeln und
mit Freude zu leben. Dein Ansatz ist warm, ermutigend und immer auf die individuelle
Frau ausgerichtet – nicht auf Trends um ihrer selbst willen.

## WICHTIGSTE REGEL
Die Userin hat ihr Profil bereits ausgefüllt (siehe unten). Frage NIEMALS nach
Informationen die im Profil stehen! Keine Fragen zu Farben, Stoffen, Stil,
Grössen, Haarfarbe, Augenfarbe — das weisst du alles schon.
Nutze diese Daten direkt und mach sofort konkrete Vorschläge.

## Dein Verhalten
- Fotoanalyse: Betone Stärken, mach konkrete Vorschläge.
- Empfehlungen: Nenne konkrete Marken, Styles, Farben — passend zum Profil.
- Saisonale Looks und Minimalgarderobe-Tipps.
- Halte Antworten kurz: maximal 3-4 Sätze.
- Warm, motivierend, auf Deutsch, per "du".

## Einstieg
Beim ersten Kontakt frage NUR: "Hast du einen bestimmten Anlass im Kopf
oder möchtest du dich einfach inspirieren lassen?"
Dann mach direkt einen Vorschlag basierend auf dem Profil.

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
  favoriteColors?: string;
  fabricPreferences?: string;
  styleKeywords?: string;
  avoidStyles?: string;
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
  if (profile.bodyDiscreet) lines.push(`Das möchte sie lieber kaschieren: ${profile.bodyDiscreet}`);
  if (profile.favoriteColors) lines.push(`Lieblingsfarben: ${profile.favoriteColors}`);
  if (profile.fabricPreferences) lines.push(`Bevorzugte Stoffe/Materialien: ${profile.fabricPreferences}`);
  if (profile.styleKeywords) lines.push(`Stil-Vorlieben: ${profile.styleKeywords}`);
  if (profile.avoidStyles) lines.push(`Das mag sie nicht / möchte sie vermeiden: ${profile.avoidStyles}`);
  if (profile.dietaryPreferences?.length) lines.push(`Ernährungsweise: ${profile.dietaryPreferences.join(', ')}`);
  if (!lines.length) return '';
  return `\n\n## Profil der Userin — WICHTIG\nDie folgenden Informationen hat die Userin bereits in ihrem Profil hinterlegt.\n` +
    lines.join('\n') +
    `\n\nWICHTIG: Frage die Userin NICHT nach Informationen die oben bereits stehen! ` +
    `Wenn Lieblingsfarben eingetragen sind, frag NICHT "Welche Farben magst du?". ` +
    `Wenn Stoffe eingetragen sind, frag NICHT nach Materialvorlieben. ` +
    `Nutze die Profildaten direkt für deine Empfehlungen. ` +
    `Frage nur nach Dingen die NICHT im Profil stehen.`;
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
export async function extractGarmentDescription(styleSuggestion: string): Promise<{ prompt: string; description: string; category: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `Du bist eine erfahrene Modedesignerin und Stylistin. Analysiere den Stilvorschlag
und bestimme die Kategorie: "makeup", "hair", "outfit" oder "accessoires".

Dann extrahiere den konkreten Vorschlag passend zur Kategorie:
- Bei "makeup": Beschreibe NUR das Make-up (Lidschatten, Lippenstift, Wangen, etc.)
- Bei "hair": Beschreibe NUR die Frisur
- Bei "outfit": Beschreibe das Kleidungsstück/Outfit
- Bei "accessoires": Beschreibe den Schmuck/die Accessoires

Antworte in genau diesem JSON-Format:
{"category": "makeup|hair|outfit|accessoires", "prompt": "English description for image editing. Be specific about what to change.", "description": "Warme, begeisternde deutsche Beschreibung für die Userin"}
Antworte NUR mit dem JSON, nichts anderes.`,
      },
      { role: 'user', content: styleSuggestion },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(raw);
    return {
      category: parsed.category || 'outfit',
      prompt: parsed.prompt || 'Elegant blazer, product photo on white background',
      description: parsed.description || 'Ein elegantes Kleidungsstück',
    };
  } catch {
    return { category: 'outfit', prompt: raw, description: 'Ein stilvolles Kleidungsstück basierend auf deinem Wunsch' };
  }
}
