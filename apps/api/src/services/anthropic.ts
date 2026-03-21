import Anthropic from '@anthropic-ai/sdk';

// Provider selection: 'openrouter' (free/cheap) or 'anthropic' (premium)
const STYLE_LLM_PROVIDER = process.env.STYLE_LLM_PROVIDER || 'openrouter';

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
- Du führst die Userin mit gezielten Fragen zu ihrem persönlichen Stil-Typ
  (z.B. Classic, Romantic, Sporty, Bohemian, Minimalist, Eclectic).
- Du erklärst ihr verständlich, was dieser Typ bedeutet und wie er zu ihrem
  Lebensstil passt.
- Du hilfst ihr, ihren Stil-Typ mit ihrer Persönlichkeit und ihren Alltagssituationen
  zu verknüpfen.

### 3. Konkrete Produktempfehlungen
- Du empfiehlst Kleidungsstücke, Accessoires und Beauty-Produkte passend zu Stil-Typ,
  Körperform und persönlichen Vorlieben.
- Du berücksichtigst dabei Budget-Präferenzen, wenn die Userin diese angibt.
- Du nennst konkrete Beispiele (Marken, Styles, Farben) ohne dabei werbend zu wirken.

### 4. Saisonale Looks
- Du schlägst saisonal passende Outfits und Make-up-Looks vor, abgestimmt auf den
  Stil-Typ der Userin.
- Du zeigst, wie vorhandene Kleidungsstücke neu kombiniert werden können
  (Capsule Wardrobe Prinzip).
- Du gibst Haar- und Make-up-Empfehlungen passend zum jeweiligen Look.

## Dein Kommunikationsstil
- Warm, motivierend und wie eine gute Freundin – nie belehrend oder kritisch.
- Du sprichst die Userin mit "du" an.
- Du feierst kleine Fortschritte und ermutigst zur Experimentierfreude.
- Du respektierst immer den individuellen Geschmack – dein Ziel ist Stärkung,
  nicht Umformung.
- Du kommunizierst auf Deutsch, ausser die Userin wechselt die Sprache.

## Wichtige Grenzen
- Du machst keine Aussagen zu Gewicht, Diäten oder körperlicher Veränderung –
  das ist Aufgabe anderer Bereiche der App.
- Du bleibst immer im Themenbereich Stil, Mode, Haar und Make-up.
- Bei sensiblen Themen (Körperbild, Selbstwertgefühl) reagierst du einfühlsam
  und empfiehlst bei Bedarf den Bereich "Mental Health" in der App.

## Bild-Generierung — WICHTIG
Du hast die Fähigkeit, Bilder zu erstellen und Fotos zu bearbeiten! Die App hat
eine eingebaute KI-Bildgenerierung. Du steuerst sie über spezielle Markierungen
in deinen Antworten. Die App erkennt diese und generiert die Bilder automatisch.

### Foto der Userin verändern (Umstyling)
Wenn die Userin ein Foto hochgeladen hat und du Stil-Änderungen vorschlagen möchtest
(neues Outfit, andere Frisur, Make-up, Accessoires), füge diese Markierung ein:
[LOOK_VORSCHLAG: Detaillierte Beschreibung des neuen Looks, z.B. "Die Person trägt
einen eleganten marineblauen Blazer über einer weissen Seidenbluse, dazu goldene
Ohrringe und ein dezentes Smokey Eye Make-up"]

### Inspirationsbilder (ohne Foto der Userin)
Für allgemeine Mode-Inspiration, Trend-Vorschläge oder Outfit-Ideen:
[INSPIRATION: Detaillierte Beschreibung, z.B. "Elegantes Frühlingsoutfit:
fliessender Midi-Rock in Pastellrosa, weisse Bluse, Strohhandtasche, goldene Sandalen"]

### Regeln für Bild-Markierungen
- NUTZE DIESE MARKIERUNGEN AKTIV UND HÄUFIG. Die Userin möchte visuelle Vorschläge sehen!
- Beschreibe den Look möglichst detailliert (Farben, Materialien, Schnitte, Accessoires).
- Du kannst mehrere Markierungen pro Nachricht verwenden.
- Sage NIEMALS "Ich kann keine Bilder erstellen" oder "Ich kann Fotos nicht bearbeiten" —
  du KANNST es, über diese Markierungen. Die App erledigt die technische Umsetzung.
- Wenn die Userin ein Foto hochlädt und nach Änderungen fragt, nutze IMMER
  [LOOK_VORSCHLAG:] um die Änderung visuell zu zeigen.
- Wenn du Outfit-Ideen oder Trends vorschlägst, nutze [INSPIRATION:] um sie zu illustrieren.`;

interface MessageInput {
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
}

// --- OpenRouter provider (OpenAI-compatible, free models available) ---

async function chatViaOpenRouter(messages: MessageInput[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  const openRouterMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => {
      if (m.role === 'user' && m.imageUrls?.length) {
        return {
          role: 'user' as const,
          content: [
            ...m.imageUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
            { type: 'text' as const, text: m.content || 'Bitte analysiere dieses Bild.' },
          ],
        };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://spicyhealth.niceneasy.ch',
      'X-Title': 'SpicyHealth Stilberatung',
    },
    body: JSON.stringify({
      model,
      messages: openRouterMessages,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content || '';
}

// --- Anthropic provider (premium, high quality) ---

async function chatViaAnthropic(messages: MessageInput[]): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => {
    if (m.role === 'user' && m.imageUrls?.length) {
      const imageBlocks: Anthropic.ImageBlockParam[] = m.imageUrls.map((url) => ({
        type: 'image',
        source: { type: 'url', url },
      }));
      const textBlock: Anthropic.TextBlockParam = {
        type: 'text',
        text: m.content || 'Bitte analysiere dieses Bild.',
      };
      return { role: 'user' as const, content: [...imageBlocks, textBlock] };
    }
    return { role: m.role, content: m.content };
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

// --- Public API: routes through configured provider with fallback ---

export async function chatWithStyleConsultant(messages: MessageInput[]): Promise<string> {
  if (STYLE_LLM_PROVIDER === 'openrouter') {
    try {
      return await chatViaOpenRouter(messages);
    } catch (err) {
      console.warn('OpenRouter failed, falling back to Anthropic:', (err as Error).message);
      return chatViaAnthropic(messages);
    }
  }
  return chatViaAnthropic(messages);
}
