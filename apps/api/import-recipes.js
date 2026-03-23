const OpenAI = require('openai');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.+)$/);
  if (m) envVars[m[1].trim()] = m[2].trim();
});

const openai = new OpenAI({ apiKey: envVars.OPENAI_API_KEY });
const cosmos = new CosmosClient({ endpoint: envVars.COSMOS_ENDPOINT, key: envVars.COSMOS_KEY });
const rc = cosmos.database(envVars.COSMOS_DB_NAME).container('recipes');
const cred = new StorageSharedKeyCredential('spicyhealthmediaprod', process.env.STORAGE_KEY);
const bc = new BlobServiceClient('https://spicyhealthmediaprod.blob.core.windows.net', cred).getContainerClient('media');
const authorId = '5556f763-febf-45c6-8254-cdcf2e2d95eb';

function cn(i) {
  return {
    calories: Math.round(i.reduce((s, x) => s + (x.calories || 0), 0)),
    proteinG: Math.round(i.reduce((s, x) => s + (x.proteinG || 0), 0) * 10) / 10,
    carbsG: Math.round(i.reduce((s, x) => s + (x.carbsG || 0), 0) * 10) / 10,
    fatG: Math.round(i.reduce((s, x) => s + (x.fatG || 0), 0) * 10) / 10,
    fiberG: Math.round(i.reduce((s, x) => s + (x.fiberG || 0), 0) * 10) / 10,
  };
}

async function gi(prompt) {
  const r = await openai.images.generate({ model: 'dall-e-3', prompt, size: '1024x1024', quality: 'standard' });
  const url = r.data?.[0]?.url;
  if (!url) throw new Error('no img');
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const bn = 'recipes/' + uuidv4() + '.png';
  const bb = bc.getBlockBlobClient(bn);
  await bb.uploadData(buf, { blobHTTPHeaders: { blobContentType: 'image/png' } });
  return bb.url;
}

const recipes = [
  // BREAKFAST
  { c:'breakfast', t:'Avocado-Toast mit pochiertem Ei', d:'Knuspriger Vollkorntoast mit cremiger Avocado und perfekt pochiertem Ei.', pt:10, ct:5, s:1, tg:['proteinreich','schnell'],
    i:[{name:'Vollkornbrot',quantity:2,unit:'Scheiben',calories:140,proteinG:6,carbsG:24,fatG:2,fiberG:4,estimatedCostEur:0.40},{name:'Avocado',quantity:0.5,unit:'Stueck',calories:120,proteinG:1.5,carbsG:6,fatG:11,fiberG:5,estimatedCostEur:0.90},{name:'Ei',quantity:1,unit:'Stueck',calories:75,proteinG:6,carbsG:0.5,fatG:5,fiberG:0,estimatedCostEur:0.40},{name:'Chiliflocken',quantity:1,unit:'Prise',calories:0,proteinG:0,carbsG:0,fatG:0,fiberG:0,estimatedCostEur:0.02}],
    st:['Wasser simmern lassen, Essig dazugeben.','Ei vorsichtig ins Wasser gleiten lassen, 3-4 Minuten pochieren.','Avocado zerdrücken, mit Salz, Pfeffer und Zitrone würzen.','Toast mit Avocado bestreichen, Ei drauflegen, Chiliflocken darüber.'],
    ip:'Avocado toast with poached egg on sourdough, runny yolk, chili flakes, food photography, natural light' },
  { c:'breakfast', t:'Protein-Pancakes mit Beeren', d:'Fluffige Pancakes mit Magerquark — proteinreich und energiegeladen.', pt:10, ct:10, s:2, tg:['proteinreich','fitness'],
    i:[{name:'Haferflocken',quantity:80,unit:'g',calories:300,proteinG:10,carbsG:50,fatG:6,fiberG:8,estimatedCostEur:0.20},{name:'Magerquark',quantity:150,unit:'g',calories:100,proteinG:18,carbsG:6,fatG:0.3,fiberG:0,estimatedCostEur:0.60},{name:'Eier',quantity:2,unit:'Stueck',calories:150,proteinG:12,carbsG:1,fatG:10,fiberG:0,estimatedCostEur:0.80},{name:'Beeren',quantity:100,unit:'g',calories:40,proteinG:1,carbsG:9,fatG:0.3,fiberG:3,estimatedCostEur:1.20}],
    st:['Haferflocken fein mahlen.','Mit Quark und Eiern zu einem Teig mixen.','Kleine Pancakes bei mittlerer Hitze je 2-3 Min. pro Seite backen.','Mit frischen Beeren servieren.'],
    ip:'Stack of fluffy protein pancakes with fresh mixed berries, breakfast, food photography' },
  { c:'breakfast', t:'Chia-Pudding mit Mango', d:'Cremiger Chia-Pudding ueber Nacht — reich an Omega-3 und Ballaststoffen.', pt:5, ct:0, s:1, tg:['vegan','mealprep'],
    i:[{name:'Chiasamen',quantity:30,unit:'g',calories:145,proteinG:5,carbsG:12,fatG:9,fiberG:10,estimatedCostEur:0.50},{name:'Hafermilch',quantity:200,unit:'ml',calories:90,proteinG:1,carbsG:14,fatG:3,fiberG:1,estimatedCostEur:0.40},{name:'Mango',quantity:100,unit:'g',calories:60,proteinG:0.8,carbsG:15,fatG:0.3,fiberG:1.6,estimatedCostEur:0.80},{name:'Kokosflocken',quantity:5,unit:'g',calories:33,proteinG:0.3,carbsG:1,fatG:3.3,fiberG:0.9,estimatedCostEur:0.10}],
    st:['Chiasamen mit Hafermilch verruehren.','Ueber Nacht im Kuehlschrank quellen lassen.','Mit Mango und Kokosflocken toppen.'],
    ip:'Chia pudding in glass jar layered with fresh mango cubes and coconut flakes, food photography' },
  { c:'breakfast', t:'Vollkorn-Porridge mit Apfel und Zimt', d:'Warmes Haferporridge mit karamellisiertem Apfel — saettigend und voller Ballaststoffe.', pt:5, ct:10, s:1, tg:['vegan','winterrezept'],
    i:[{name:'Haferflocken',quantity:50,unit:'g',calories:188,proteinG:6.5,carbsG:31,fatG:3.5,fiberG:5,estimatedCostEur:0.12},{name:'Hafermilch',quantity:250,unit:'ml',calories:112,proteinG:1.2,carbsG:17,fatG:3.8,fiberG:1.2,estimatedCostEur:0.50},{name:'Apfel',quantity:1,unit:'Stueck',calories:52,proteinG:0.3,carbsG:14,fatG:0.2,fiberG:2.4,estimatedCostEur:0.40},{name:'Walnuesse',quantity:15,unit:'g',calories:98,proteinG:2.3,carbsG:1,fatG:9.5,fiberG:1,estimatedCostEur:0.30}],
    st:['Haferflocken mit Milch aufkochen, 5 Min. koecheln.','Apfel wuerfeln, mit Zimt kurz anbraten.','Porridge mit Apfel und Walnuessen servieren.'],
    ip:'Warm oatmeal porridge bowl with caramelized apple pieces, cinnamon, walnuts, food photography' },
  { c:'breakfast', t:'Griechischer Joghurt mit Granola', d:'Cremiger griechischer Joghurt mit knusprigem Granola und Fruechten.', pt:5, ct:0, s:1, tg:['proteinreich','schnell'],
    i:[{name:'Griechischer Joghurt',quantity:200,unit:'g',calories:130,proteinG:20,carbsG:8,fatG:0.8,fiberG:0,estimatedCostEur:0.80},{name:'Granola',quantity:40,unit:'g',calories:180,proteinG:4,carbsG:26,fatG:7,fiberG:3,estimatedCostEur:0.50},{name:'Erdbeeren',quantity:80,unit:'g',calories:26,proteinG:0.7,carbsG:6,fatG:0.2,fiberG:1.6,estimatedCostEur:0.60},{name:'Leinsamen',quantity:10,unit:'g',calories:53,proteinG:1.8,carbsG:0.3,fatG:4.2,fiberG:2.7,estimatedCostEur:0.08}],
    st:['Joghurt in Schale geben.','Granola darueber streuen.','Mit Erdbeeren und Leinsamen toppen.'],
    ip:'Greek yogurt bowl with crunchy granola, fresh strawberries, seeds, food photography' },

  // LUNCH
  { c:'lunch', t:'Quinoa-Bowl mit geroestetem Gemuese', d:'Bunte Bowl mit Quinoa, Ofengemuese und Tahini-Dressing.', pt:10, ct:25, s:2, tg:['vegan','proteinreich'],
    i:[{name:'Quinoa',quantity:150,unit:'g',calories:555,proteinG:20,carbsG:97,fatG:9,fiberG:10,estimatedCostEur:1.00},{name:'Suesskartoffel',quantity:200,unit:'g',calories:172,proteinG:3.2,carbsG:40,fatG:0.2,fiberG:6,estimatedCostEur:0.80},{name:'Kichererbsen',quantity:200,unit:'g',calories:260,proteinG:18,carbsG:36,fatG:4,fiberG:12,estimatedCostEur:0.60},{name:'Spinat',quantity:80,unit:'g',calories:18,proteinG:2.3,carbsG:1.4,fatG:0.3,fiberG:1.8,estimatedCostEur:0.60},{name:'Tahini',quantity:20,unit:'g',calories:118,proteinG:3.4,carbsG:1.2,fatG:11,fiberG:0.8,estimatedCostEur:0.40}],
    st:['Quinoa kochen.','Suesskartoffel wuerfeln, mit Kichererbsen bei 200 Grad roesten.','Tahini-Dressing anruehren.','In Bowls mit Spinat anrichten.'],
    ip:'Colorful quinoa buddha bowl with roasted sweet potato, chickpeas, spinach, tahini, food photography' },
  { c:'lunch', t:'Linsensuppe mit Kurkuma', d:'Waermende rote Linsensuppe — saettigend und entzuendungshemmend.', pt:10, ct:25, s:4, tg:['vegan','guenstig'],
    i:[{name:'Rote Linsen',quantity:250,unit:'g',calories:850,proteinG:62,carbsG:140,fatG:4,fiberG:28,estimatedCostEur:1.00},{name:'Karotten',quantity:200,unit:'g',calories:82,proteinG:1.8,carbsG:19,fatG:0.4,fiberG:5.6,estimatedCostEur:0.40},{name:'Zwiebel',quantity:1,unit:'Stueck',calories:40,proteinG:1,carbsG:9,fatG:0.1,fiberG:1.5,estimatedCostEur:0.20},{name:'Kokosmilch',quantity:100,unit:'ml',calories:187,proteinG:1.8,carbsG:3,fatG:19,fiberG:0,estimatedCostEur:0.50}],
    st:['Zwiebel und Karotten anduensten.','Kurkuma dazu, kurz mitroesten.','Linsen und 700ml Wasser, 20 Min. koecheln.','Kokosmilch einruehren, puerieren.'],
    ip:'Creamy golden lentil soup with turmeric, cream swirl, fresh herbs, food photography' },
  { c:'lunch', t:'Thunfisch-Salat mit Avocado', d:'Frischer Salat mit proteinreichem Thunfisch und cremiger Avocado.', pt:15, ct:0, s:1, tg:['proteinreich','lowcarb'],
    i:[{name:'Thunfisch (Dose)',quantity:150,unit:'g',calories:165,proteinG:36,carbsG:0,fatG:1.5,fiberG:0,estimatedCostEur:1.50},{name:'Avocado',quantity:0.5,unit:'Stueck',calories:120,proteinG:1.5,carbsG:6,fatG:11,fiberG:5,estimatedCostEur:0.90},{name:'Cherrytomaten',quantity:100,unit:'g',calories:18,proteinG:0.9,carbsG:3.9,fatG:0.2,fiberG:1.2,estimatedCostEur:0.60},{name:'Gurke',quantity:100,unit:'g',calories:12,proteinG:0.6,carbsG:2,fatG:0.1,fiberG:0.5,estimatedCostEur:0.30}],
    st:['Thunfisch abtropfen.','Avocado, Tomaten, Gurke schneiden.','Anrichten, mit Olivenoel und Zitrone wuerzen.'],
    ip:'Fresh tuna salad with avocado, cherry tomatoes, cucumber, food photography' },
  { c:'lunch', t:'Vollkorn-Pasta mit Brokkoli-Pesto', d:'Al dente Vollkornpasta mit selbstgemachtem Brokkoli-Pesto.', pt:10, ct:15, s:2, tg:['vegetarisch','ballaststoffreich'],
    i:[{name:'Vollkorn-Penne',quantity:200,unit:'g',calories:700,proteinG:26,carbsG:130,fatG:6,fiberG:20,estimatedCostEur:0.80},{name:'Brokkoli',quantity:250,unit:'g',calories:85,proteinG:7,carbsG:13,fatG:0.8,fiberG:6.5,estimatedCostEur:1.00},{name:'Parmesan',quantity:30,unit:'g',calories:118,proteinG:10,carbsG:0.3,fatG:8.5,fiberG:0,estimatedCostEur:0.80},{name:'Pinienkerne',quantity:20,unit:'g',calories:135,proteinG:2.7,carbsG:0.7,fatG:14,fiberG:0.4,estimatedCostEur:0.70}],
    st:['Pasta kochen, Brokkoli die letzten 3 Min. mitkochen.','Brokkoli mit Parmesan und Pinienkernen puerieren.','Pasta mit Pesto vermengen.'],
    ip:'Whole wheat penne with bright green broccoli pesto, parmesan, food photography' },
  { c:'lunch', t:'Asia-Bowl mit Edamame und Tofu', d:'Knusprig gebratener Tofu mit Edamame und Sesam-Dressing.', pt:10, ct:15, s:2, tg:['vegan','asiatisch'],
    i:[{name:'Tofu',quantity:200,unit:'g',calories:190,proteinG:20,carbsG:3,fatG:11,fiberG:0.4,estimatedCostEur:1.20},{name:'Basmatireis',quantity:150,unit:'g',calories:540,proteinG:10,carbsG:117,fatG:1.5,fiberG:1.5,estimatedCostEur:0.40},{name:'Edamame',quantity:100,unit:'g',calories:122,proteinG:11,carbsG:8,fatG:5,fiberG:5,estimatedCostEur:1.00},{name:'Karotten',quantity:100,unit:'g',calories:41,proteinG:0.9,carbsG:9.5,fatG:0.2,fiberG:2.8,estimatedCostEur:0.20}],
    st:['Reis kochen.','Tofu wuerfeln, knusprig braten.','Dressing aus Sojasauce und Sesamoel.','In Bowls anrichten mit Sesam.'],
    ip:'Asian buddha bowl with crispy tofu, edamame, rice, sesame seeds, food photography' },

  // DINNER
  { c:'dinner', t:'Poulet-Brust mit Ofenkartoffeln', d:'Saftige Poulet-Brust mit Kraeutern, Kartoffeln und gruenen Bohnen.', pt:10, ct:35, s:2, tg:['proteinreich','klassisch'],
    i:[{name:'Poulet-Brust',quantity:300,unit:'g',calories:330,proteinG:62,carbsG:0,fatG:7,fiberG:0,estimatedCostEur:3.50},{name:'Kartoffeln',quantity:400,unit:'g',calories:308,proteinG:8,carbsG:68,fatG:0.4,fiberG:8.8,estimatedCostEur:0.60},{name:'Gruene Bohnen',quantity:200,unit:'g',calories:62,proteinG:3.8,carbsG:12,fatG:0.2,fiberG:5.4,estimatedCostEur:1.00},{name:'Olivenoel',quantity:2,unit:'EL',calories:216,proteinG:0,carbsG:0,fatG:24,fiberG:0,estimatedCostEur:0.30}],
    st:['Kartoffeln vierteln, mit Oel bei 200 Grad 30 Min. roesten.','Poulet braten, je 5-6 Min. pro Seite.','Bohnen 5 Min. blanchieren.','Zusammen anrichten.'],
    ip:'Grilled chicken breast with roasted potatoes and green beans, rosemary, food photography' },
  { c:'dinner', t:'Lachsfilet mit Quinoa und Spargel', d:'Zarter Lachs auf Quinoa mit gruenem Spargel — reich an Omega-3.', pt:10, ct:20, s:2, tg:['proteinreich','omega3'],
    i:[{name:'Lachsfilet',quantity:300,unit:'g',calories:624,proteinG:60,carbsG:0,fatG:42,fiberG:0,estimatedCostEur:5.00},{name:'Quinoa',quantity:150,unit:'g',calories:555,proteinG:20,carbsG:97,fatG:9,fiberG:10,estimatedCostEur:1.00},{name:'Gruener Spargel',quantity:250,unit:'g',calories:50,proteinG:5.5,carbsG:7.5,fatG:0.3,fiberG:5.2,estimatedCostEur:2.00},{name:'Zitrone',quantity:1,unit:'Stueck',calories:17,proteinG:0.6,carbsG:5.4,fatG:0.2,fiberG:1.6,estimatedCostEur:0.30}],
    st:['Quinoa kochen.','Spargel in Pfanne braten.','Lachs je 3-4 Min. pro Seite braten.','Mit Zitrone und Dill anrichten.'],
    ip:'Pan-seared salmon on quinoa with grilled asparagus, elegant dinner, food photography' },
  { c:'dinner', t:'Gefuellte Peperoni mit Hirse', d:'Bunte Peperoni gefuellt mit Hirse und Feta — vegetarisch und farbenfroh.', pt:15, ct:30, s:2, tg:['vegetarisch','ballaststoffreich'],
    i:[{name:'Peperoni',quantity:4,unit:'Stueck',calories:120,proteinG:4,carbsG:24,fatG:0.8,fiberG:8,estimatedCostEur:2.00},{name:'Hirse',quantity:150,unit:'g',calories:540,proteinG:16,carbsG:103,fatG:6,fiberG:12,estimatedCostEur:0.60},{name:'Feta',quantity:100,unit:'g',calories:264,proteinG:14,carbsG:4,fatG:21,fiberG:0,estimatedCostEur:1.20},{name:'Tomatenpassata',quantity:200,unit:'ml',calories:48,proteinG:2,carbsG:8,fatG:0.4,fiberG:2.4,estimatedCostEur:0.40}],
    st:['Hirse kochen.','Mit Feta und Kraeutern mischen.','Peperoni fuellen.','Mit Passata bei 190 Grad 25 Min. backen.'],
    ip:'Colorful stuffed bell peppers with millet and feta in baking dish, food photography' },

  // SNACK
  { c:'snack', t:'Hummus mit Gemuesessticks', d:'Cremiger Hummus mit knackigen Gemuesessticks.', pt:10, ct:0, s:2, tg:['vegan','proteinreich'],
    i:[{name:'Kichererbsen',quantity:240,unit:'g',calories:312,proteinG:22,carbsG:43,fatG:5,fiberG:14,estimatedCostEur:0.60},{name:'Tahini',quantity:30,unit:'g',calories:177,proteinG:5,carbsG:1.8,fatG:16,fiberG:1.2,estimatedCostEur:0.60},{name:'Karotten',quantity:150,unit:'g',calories:62,proteinG:1.4,carbsG:14,fatG:0.3,fiberG:4.2,estimatedCostEur:0.30},{name:'Gurke',quantity:150,unit:'g',calories:18,proteinG:0.9,carbsG:3,fatG:0.1,fiberG:0.8,estimatedCostEur:0.40}],
    st:['Kichererbsen mit Tahini und Zitrone puerieren.','Gemuese in Sticks schneiden.','Servieren.'],
    ip:'Creamy hummus with colorful vegetable sticks, carrots, cucumber, food photography' },
  { c:'snack', t:'Edamame mit Meersalz', d:'Gedaempfte Edamame — der japanische Protein-Snack.', pt:2, ct:5, s:1, tg:['vegan','proteinreich'],
    i:[{name:'Edamame',quantity:150,unit:'g',calories:183,proteinG:16,carbsG:12,fatG:7.5,fiberG:7.5,estimatedCostEur:1.00}],
    st:['5 Min. in Salzwasser kochen.','Mit Meersalz bestreuen.'],
    ip:'Bowl of steamed edamame beans with sea salt flakes, food photography' },
  { c:'snack', t:'Apfelschnitze mit Erdnussbutter', d:'Knackige Apfelschnitze mit cremiger Erdnussbutter.', pt:3, ct:0, s:1, tg:['schnell','ballaststoffreich'],
    i:[{name:'Apfel',quantity:1,unit:'Stueck',calories:52,proteinG:0.3,carbsG:14,fatG:0.2,fiberG:2.4,estimatedCostEur:0.40},{name:'Erdnussbutter',quantity:20,unit:'g',calories:118,proteinG:5,carbsG:2.6,fatG:10,fiberG:1.6,estimatedCostEur:0.30}],
    st:['Apfel in Schnitze schneiden.','Mit Erdnussbutter dippen.'],
    ip:'Apple slices with peanut butter dip, healthy snack, food photography' },
  { c:'snack', t:'Gurkenschiffchen mit Frischkaese', d:'Erfrischende Gurken gefuellt mit Kraeuterfrischkaese.', pt:5, ct:0, s:1, tg:['lowcarb','schnell'],
    i:[{name:'Gurke',quantity:1,unit:'Stueck',calories:24,proteinG:1.2,carbsG:4,fatG:0.2,fiberG:1,estimatedCostEur:0.50},{name:'Kraeuterfrischkaese',quantity:50,unit:'g',calories:120,proteinG:3,carbsG:2,fatG:11,fiberG:0,estimatedCostEur:0.40},{name:'Cherrytomaten',quantity:50,unit:'g',calories:9,proteinG:0.4,carbsG:2,fatG:0.1,fiberG:0.6,estimatedCostEur:0.30}],
    st:['Gurke halbieren, Kerne aushoehlen.','Frischkaese einfuellen.','Tomaten als Topping.'],
    ip:'Cucumber boats filled with herb cream cheese and cherry tomatoes, food photography' },
  { c:'snack', t:'Joghurt-Dip mit Nuessen', d:'Cremiger Joghurt mit Honig und gemischten Nuessen.', pt:5, ct:0, s:1, tg:['proteinreich','schnell'],
    i:[{name:'Griechischer Joghurt',quantity:150,unit:'g',calories:98,proteinG:15,carbsG:6,fatG:0.6,fiberG:0,estimatedCostEur:0.60},{name:'Nuesse',quantity:20,unit:'g',calories:120,proteinG:4,carbsG:3,fatG:11,fiberG:1.5,estimatedCostEur:0.40},{name:'Honig',quantity:1,unit:'TL',calories:22,proteinG:0,carbsG:6,fatG:0,fiberG:0,estimatedCostEur:0.10}],
    st:['Joghurt in Schale.','Nuesse darueber.','Mit Honig betraeufeln.'],
    ip:'Greek yogurt bowl with mixed nuts and honey drizzle, food photography' },

  // DESSERT
  { c:'dessert', t:'Dunkle Schokoladenmousse', d:'Luftige Mousse aus dunkler Schokolade — weniger Zucker, viele Antioxidantien.', pt:15, ct:5, s:4, tg:['glutenfrei'],
    i:[{name:'Dunkle Schokolade 70%',quantity:150,unit:'g',calories:855,proteinG:11,carbsG:69,fatG:60,fiberG:15,estimatedCostEur:2.00},{name:'Eier',quantity:3,unit:'Stueck',calories:225,proteinG:18,carbsG:1.5,fatG:15,fiberG:0,estimatedCostEur:1.20},{name:'Rahm',quantity:100,unit:'ml',calories:340,proteinG:2,carbsG:3,fatG:36,fiberG:0,estimatedCostEur:0.60}],
    st:['Schokolade im Wasserbad schmelzen.','Eier trennen, Eiweiss steif schlagen.','Eigelb unter Schokolade ruehren, Rahm und Eischnee unterheben.','2 Stunden kuehlen.'],
    ip:'Dark chocolate mousse in elegant glass cups, chocolate shavings, food photography' },
  { c:'dessert', t:'Beeren-Crumble mit Haferflocken', d:'Warmer Beeren-Crumble mit knusprigem Hafer-Topping.', pt:10, ct:25, s:4, tg:['ballaststoffreich'],
    i:[{name:'Gemischte Beeren',quantity:400,unit:'g',calories:160,proteinG:4,carbsG:36,fatG:1.2,fiberG:12,estimatedCostEur:2.00},{name:'Haferflocken',quantity:100,unit:'g',calories:375,proteinG:13,carbsG:63,fatG:7,fiberG:10,estimatedCostEur:0.25},{name:'Butter',quantity:40,unit:'g',calories:288,proteinG:0.3,carbsG:0,fatG:32,fiberG:0,estimatedCostEur:0.30},{name:'Mandeln',quantity:30,unit:'g',calories:180,proteinG:6,carbsG:2,fatG:16,fiberG:3.5,estimatedCostEur:0.50}],
    st:['Beeren in Ofenform.','Haferflocken mit Butter und Mandeln mischen.','Ueber Beeren verteilen.','Bei 180 Grad 25 Min. backen.'],
    ip:'Berry crumble with golden oat topping, mixed berries, rustic, food photography' },
  { c:'dessert', t:'Panna Cotta mit Himbeersauce', d:'Zarte italienische Panna Cotta mit frischer Himbeersauce.', pt:10, ct:5, s:4, tg:['glutenfrei','italienisch'],
    i:[{name:'Rahm',quantity:400,unit:'ml',calories:1360,proteinG:8,carbsG:12,fatG:144,fiberG:0,estimatedCostEur:2.00},{name:'Vanilleschote',quantity:1,unit:'Stueck',calories:12,proteinG:0.1,carbsG:2.5,fatG:0.1,fiberG:0,estimatedCostEur:1.50},{name:'Gelatine',quantity:3,unit:'Blaetter',calories:20,proteinG:5,carbsG:0,fatG:0,fiberG:0,estimatedCostEur:0.30},{name:'Himbeeren',quantity:200,unit:'g',calories:66,proteinG:2.4,carbsG:11,fatG:1.2,fiberG:12,estimatedCostEur:2.00}],
    st:['Gelatine einweichen.','Rahm mit Vanille erhitzen.','Gelatine aufloesen, in Foermchen giessen.','4 Stunden kuehlen, mit Himbeersauce servieren.'],
    ip:'Panna cotta with raspberry sauce, mint garnish, elegant Italian dessert, food photography' },
  { c:'dessert', t:'Bananenbrot ohne Zucker', d:'Saftiges Bananenbrot nur mit natuerlicher Suesse reifer Bananen.', pt:10, ct:45, s:8, tg:['zuckerfrei','ballaststoffreich'],
    i:[{name:'Reife Bananen',quantity:3,unit:'Stueck',calories:270,proteinG:3,carbsG:69,fatG:0.9,fiberG:7.5,estimatedCostEur:0.90},{name:'Eier',quantity:2,unit:'Stueck',calories:150,proteinG:12,carbsG:1,fatG:10,fiberG:0,estimatedCostEur:0.80},{name:'Vollkornmehl',quantity:200,unit:'g',calories:640,proteinG:22,carbsG:122,fatG:4,fiberG:20,estimatedCostEur:0.40},{name:'Walnuesse',quantity:50,unit:'g',calories:327,proteinG:7.6,carbsG:3.4,fatG:33,fiberG:3.4,estimatedCostEur:1.00}],
    st:['Bananen zerdruecken.','Eier dazugeben.','Mehl unterheben.','Walnuesse dazu, bei 175 Grad 45 Min. backen.'],
    ip:'Sliced banana bread with walnuts on wooden cutting board, food photography' },
  { c:'dessert', t:'Frozen Joghurt mit Mango', d:'Cremiger Frozen Joghurt mit Mango — leichter als Glace.', pt:10, ct:0, s:4, tg:['leicht','glutenfrei'],
    i:[{name:'Griechischer Joghurt',quantity:400,unit:'g',calories:260,proteinG:40,carbsG:16,fatG:1.6,fiberG:0,estimatedCostEur:1.60},{name:'Mango (tiefgekuehlt)',quantity:250,unit:'g',calories:150,proteinG:2,carbsG:38,fatG:0.8,fiberG:4,estimatedCostEur:1.50},{name:'Honig',quantity:2,unit:'EL',calories:88,proteinG:0.1,carbsG:24,fatG:0,fiberG:0,estimatedCostEur:0.20}],
    st:['Gefrorene Mango mit Joghurt und Honig mixen.','Sofort servieren oder 2 Std. einfrieren.'],
    ip:'Frozen yogurt scoops with fresh mango, tropical dessert, food photography' },

  // SMOOTHIE
  { c:'smoothie', t:'Beeren-Protein-Smoothie', d:'Cremiger Smoothie mit Beeren und Quark — voller Protein.', pt:5, ct:0, s:1, tg:['proteinreich','fitness'],
    i:[{name:'Gemischte Beeren',quantity:150,unit:'g',calories:60,proteinG:1.5,carbsG:14,fatG:0.5,fiberG:4.5,estimatedCostEur:1.20},{name:'Magerquark',quantity:100,unit:'g',calories:67,proteinG:12,carbsG:4,fatG:0.2,fiberG:0,estimatedCostEur:0.40},{name:'Banane',quantity:0.5,unit:'Stueck',calories:45,proteinG:0.5,carbsG:11.5,fatG:0.2,fiberG:1.3,estimatedCostEur:0.15},{name:'Hafermilch',quantity:150,unit:'ml',calories:68,proteinG:0.8,carbsG:10,fatG:2.3,fiberG:0.8,estimatedCostEur:0.30}],
    st:['Alles in den Mixer.','30 Sekunden mixen.','Servieren.'],
    ip:'Purple berry protein smoothie in tall glass with fresh berries, food photography' },
  { c:'smoothie', t:'Tropical Mango-Ananas-Smoothie', d:'Sonniger Smoothie mit Mango und Ananas — wie Ferien im Glas.', pt:5, ct:0, s:1, tg:['vegan','tropisch'],
    i:[{name:'Mango',quantity:100,unit:'g',calories:60,proteinG:0.8,carbsG:15,fatG:0.3,fiberG:1.6,estimatedCostEur:0.80},{name:'Ananas',quantity:100,unit:'g',calories:50,proteinG:0.5,carbsG:13,fatG:0.1,fiberG:1.4,estimatedCostEur:0.60},{name:'Kokosmilch',quantity:100,unit:'ml',calories:187,proteinG:1.8,carbsG:3,fatG:19,fiberG:0,estimatedCostEur:0.50},{name:'Banane',quantity:0.5,unit:'Stueck',calories:45,proteinG:0.5,carbsG:11.5,fatG:0.2,fiberG:1.3,estimatedCostEur:0.15}],
    st:['Alles in den Mixer.','Puerieren und geniessen.'],
    ip:'Tropical mango pineapple smoothie, bright yellow, coconut, food photography' },
  { c:'smoothie', t:'Spinat-Bananen-Smoothie', d:'Gruener Smoothie der suess schmeckt — Spinat versteckt sich gut.', pt:5, ct:0, s:1, tg:['vegan','gruen'],
    i:[{name:'Babyspinat',quantity:60,unit:'g',calories:14,proteinG:1.7,carbsG:1,fatG:0.2,fiberG:1.3,estimatedCostEur:0.50},{name:'Banane',quantity:1,unit:'Stueck',calories:90,proteinG:1,carbsG:23,fatG:0.3,fiberG:2.5,estimatedCostEur:0.30},{name:'Apfel',quantity:0.5,unit:'Stueck',calories:26,proteinG:0.2,carbsG:7,fatG:0.1,fiberG:1.2,estimatedCostEur:0.20},{name:'Leinsamen',quantity:10,unit:'g',calories:53,proteinG:1.8,carbsG:0.3,fatG:4.2,fiberG:2.7,estimatedCostEur:0.08}],
    st:['Alles mit 200ml Wasser in den Mixer.','Glatt mixen.'],
    ip:'Vibrant green smoothie in glass, spinach, banana, food photography' },
  { c:'smoothie', t:'Ruebli-Orangen-Smoothie', d:'Der Vitamin-C-Booster mit Karotten und Orangen.', pt:5, ct:0, s:1, tg:['vegan','immunbooster'],
    i:[{name:'Karotten',quantity:100,unit:'g',calories:41,proteinG:0.9,carbsG:9.5,fatG:0.2,fiberG:2.8,estimatedCostEur:0.20},{name:'Orange',quantity:1,unit:'Stueck',calories:47,proteinG:0.9,carbsG:12,fatG:0.1,fiberG:2.4,estimatedCostEur:0.50},{name:'Ingwer',quantity:5,unit:'g',calories:4,proteinG:0.1,carbsG:0.9,fatG:0,fiberG:0.1,estimatedCostEur:0.05}],
    st:['Karotten und Orange schaelen.','Mit Ingwer und 150ml Wasser puerieren.'],
    ip:'Orange carrot smoothie with ginger, bright color, food photography' },
  { c:'smoothie', t:'Schoko-Erdnuss-Smoothie', d:'Cremiger Schoko-Smoothie mit Erdnussbutter — schmeckt wie Dessert, ist aber gesund.', pt:5, ct:0, s:1, tg:['proteinreich','fitness'],
    i:[{name:'Banane (gefroren)',quantity:1,unit:'Stueck',calories:90,proteinG:1,carbsG:23,fatG:0.3,fiberG:2.5,estimatedCostEur:0.30},{name:'Kakaopulver',quantity:15,unit:'g',calories:38,proteinG:3,carbsG:4,fatG:1.5,fiberG:4.5,estimatedCostEur:0.20},{name:'Erdnussbutter',quantity:20,unit:'g',calories:118,proteinG:5,carbsG:2.6,fatG:10,fiberG:1.6,estimatedCostEur:0.30},{name:'Hafermilch',quantity:250,unit:'ml',calories:112,proteinG:1.2,carbsG:17,fatG:3.8,fiberG:1.2,estimatedCostEur:0.50}],
    st:['Alles in den Mixer.','Cremig mixen und geniessen.'],
    ip:'Chocolate peanut butter smoothie, rich brown color, food photography' },
];

async function run() {
  let ok = 0;
  for (let idx = 0; idx < recipes.length; idx++) {
    const r = recipes[idx];
    try {
      process.stdout.write((idx + 1) + '/' + recipes.length + ' ' + r.t + ' ... ');
      const imageUrl = await gi(r.ip);
      const nutrition = cn(r.i);
      const cost = Math.round(r.i.reduce((s, x) => s + (x.estimatedCostEur || 0), 0) * 100) / 100;
      await rc.items.create({
        id: uuidv4(), title: r.t, description: r.d, category: r.c, imageUrl,
        prepTimeMinutes: r.pt, cookTimeMinutes: r.ct, servings: r.s,
        ingredients: r.i, instructions: r.st, nutrition, estimatedCostEur: cost,
        tags: r.tg, authorId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      ok++;
      console.log('OK (' + nutrition.calories + ' kcal, CHF ' + cost + ')');
    } catch (e) {
      console.log('FAIL:', e.message?.substring(0, 80));
    }
  }
  console.log('=== FERTIG: ' + ok + '/' + recipes.length + ' ===');
}
run();
