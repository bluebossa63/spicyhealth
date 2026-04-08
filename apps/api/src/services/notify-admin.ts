import { ConfidentialClientApplication } from '@azure/msal-node';

const NOTIFY_EMAIL = process.env.FEEDBACK_NOTIFY_EMAIL || 'servicedesk@niceneasy.ch';
const SENDER_EMAIL = process.env.GRAPH_SENDER_EMAIL || 'servicedesk@niceneasy.ch';

async function getGraphToken(): Promise<string | null> {
  const tenantId = process.env.AZURE_TENANT_ID || process.env.M365_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.M365_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || process.env.M365_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;

  const app = new ConfidentialClientApplication({
    auth: { clientId, clientSecret, authority: `https://login.microsoftonline.com/${tenantId}` },
  });
  const result = await app.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  return result?.accessToken ?? null;
}

async function sendMail(subject: string, html: string): Promise<void> {
  const token = await getGraphToken();
  if (!token) {
    console.warn('notifyAdmin: Graph credentials not configured, skipping');
    return;
  }
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: NOTIFY_EMAIL } }],
      },
      saveToSentItems: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph sendMail failed: ${res.status} — ${err}`);
  }
}

function wrap(emoji: string, title: string, rows: [string, string][]): string {
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 0;color:#666;width:130px;font-size:13px;vertical-align:top">${label}</td>
      <td style="padding:8px 0;color:#333;font-size:13px">${value}</td>
    </tr>`).join('');
  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#fdf8f4;padding:28px;border-radius:12px">
      <h2 style="color:#8B4A6B;font-size:20px;margin-bottom:4px">${emoji} ${title}</h2>
      <p style="color:#aaa;font-size:12px;margin-top:0">${new Date().toLocaleString('de-CH')}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">${rowsHtml}</table>
      <p style="color:#ccc;font-size:11px;margin-top:24px">SpicyHealth — Testphase Monitoring</p>
    </div>`;
}

export async function notifyNewUser(user: { name: string; email: string }): Promise<void> {
  const html = wrap('👤', 'Neue Registrierung', [
    ['Name', user.name || '—'],
    ['E-Mail', user.email],
  ]);
  await sendMail('👤 SpicyHealth: Neue Nutzerin registriert', html);
}

export async function notifyNewRecipe(recipe: { title: string; category: string }, user: { name: string; email: string }): Promise<void> {
  const html = wrap('🥗', 'Neues Rezept erfasst', [
    ['Rezept', recipe.title],
    ['Kategorie', recipe.category || '—'],
    ['Von', `${user.name} (${user.email})`],
  ]);
  await sendMail(`🥗 SpicyHealth: Rezept «${recipe.title}» erfasst`, html);
}

export async function notifyMealPlan(week: string, user: { name: string; email: string }): Promise<void> {
  const html = wrap('📅', 'Mahlzeitenplan erstellt', [
    ['Woche', week],
    ['Von', `${user.name} (${user.email})`],
  ]);
  await sendMail('📅 SpicyHealth: Mahlzeitenplan erstellt', html);
}

// Daily log: only send once per user per day (tracked in memory — sufficient for testing phase)
const dailyLogSent = new Map<string, string>(); // userId -> date string

export async function notifyDailyLog(log: { water: number; mood?: number; energy?: number }, user: { id: string; name: string; email: string }): Promise<void> {
  const today = new Date().toLocaleDateString('de-CH');
  if (dailyLogSent.get(user.id) === today) return; // already sent today
  dailyLogSent.set(user.id, today);

  const html = wrap('💧', 'Mein-Tag Eintrag', [
    ['Nutzerin', `${user.name} (${user.email})`],
    ['Wasser', `${log.water} Gläser`],
    ['Stimmung', log.mood !== undefined ? `${log.mood}/5` : '—'],
    ['Energie', log.energy !== undefined ? `${log.energy}/5` : '—'],
  ]);
  await sendMail('💧 SpicyHealth: Mein-Tag ausgefüllt', html);
}

export async function notifyStyleChat(firstMessage: string, user: { name: string; email: string }): Promise<void> {
  const preview = firstMessage.length > 120 ? firstMessage.substring(0, 117) + '...' : firstMessage;
  const html = wrap('👗', 'Stilberaterin gestartet', [
    ['Nutzerin', `${user.name} (${user.email})`],
    ['Erste Nachricht', preview],
  ]);
  await sendMail('👗 SpicyHealth: Stilberaterin gestartet', html);
}

export async function notifyRecipeComment(comment: { body: string; recipeTitle?: string }, user: { name: string; email: string }): Promise<void> {
  const preview = comment.body.length > 200 ? comment.body.substring(0, 197) + '...' : comment.body;
  const html = wrap('💬', 'Kommentar geschrieben', [
    ['Nutzerin', `${user.name} (${user.email})`],
    ['Rezept', comment.recipeTitle || '—'],
    ['Kommentar', preview],
  ]);
  await sendMail(`💬 SpicyHealth: Kommentar von ${user.name}`, html);
}
