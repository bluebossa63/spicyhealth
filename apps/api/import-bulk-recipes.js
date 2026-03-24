// Bulk recipe import — generates recipes with OpenAI images
// Run: STORAGE_KEY="..." node import-bulk-recipes.js

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

// Helper to create a recipe object
function R(c, t, d, pt, ct, s, tg, i, st, ip) {
  return { c, t, d, pt, ct, s, tg, i, st, ip };
}
function I(name, quantity, unit, calories, proteinG, carbsG, fatG, fiberG, cost) {
  return { name, quantity, unit, calories, proteinG, carbsG, fatG, fiberG: fiberG || 0, estimatedCostEur: cost };
}

const recipes = [
  // === BREAKFAST (12 neue) ===
  R('breakfast','Rüeblicake-Porridge','Warmes Porridge inspiriert vom Schweizer Rüeblicake — mit Zimt und Nüssen.',10,5,1,['vegetarisch','schweiz'],
    [I('Haferflocken',50,'g',188,6.5,31,3.5,5,0.12),I('Rüebli (gerieben)',60,'g',25,0.5,5.7,0.1,1.7,0.12),I('Hafermilch',200,'ml',90,0.6,14,3,0.8,0.40),I('Walnüsse',10,'g',65,1.5,0.7,6.5,0.7,0.20),I('Zimt',1,'TL',6,0.1,1.5,0,1.3,0.05)],
    ['Haferflocken mit Milch aufkochen.','Geriebene Rüebli dazugeben, 5 Min. köcheln.','Mit Walnüssen und Zimt toppen.'],
    'Carrot cake porridge in a bowl, grated carrots, cinnamon, walnuts, cozy breakfast, food photography'),
  R('breakfast','Smoothie Bowl mit Acai','Dickflüssige Acai-Bowl getoppt mit Granola, Früchten und Kokosflocken.',10,0,1,['vegan','superfood'],
    [I('Acai-Pulver',10,'g',53,1,5,3.5,3,0.80),I('Banane (gefroren)',1,'Stück',90,1,23,0.3,2.5,0.30),I('Hafermilch',100,'ml',45,0.3,7,1.5,0.4,0.20),I('Granola',30,'g',135,3,19.5,5.3,2.3,0.40),I('Kokosflocken',5,'g',33,0.3,1,3.3,0.9,0.10)],
    ['Acai-Pulver mit Banane und wenig Milch dick mixen.','In Schale füllen.','Mit Granola, Früchten und Kokos toppen.'],
    'Acai smoothie bowl with granola, banana slices, coconut flakes, vibrant purple, food photography'),
  R('breakfast','Spinat-Feta-Omelette','Fluffiges Omelette gefüllt mit Spinat und Feta — proteinreich und sättigend.',5,10,1,['proteinreich','lowcarb','vegetarisch'],
    [I('Eier',3,'Stück',225,18,1.5,15,0,1.20),I('Babyspinat',40,'g',9,1.2,0.5,0.2,0.9,0.30),I('Feta',30,'g',79,4.2,1.2,6.3,0,0.40),I('Olivenöl',1,'TL',44,0,0,5,0,0.05)],
    ['Eier verquirlen, salzen und pfeffern.','In Öl bei mittlerer Hitze stocken lassen.','Spinat und Feta auf eine Hälfte, zuklappen.'],
    'Fluffy spinach feta omelette on a plate, golden, fresh herbs, breakfast, food photography'),
  R('breakfast','Bananen-Nuss-Brot Scheiben','Getoastete Scheiben vom selbstgemachten Bananenbrot mit Nussbutter.',5,3,1,['schnell','ballaststoffreich'],
    [I('Bananenbrot',2,'Scheiben',170,5.5,30,3,5,0.40),I('Mandelbutter',15,'g',92,3,1,8.5,1.2,0.40),I('Honig',1,'TL',22,0,6,0,0,0.10)],
    ['Bananenbrot-Scheiben toasten.','Mit Mandelbutter bestreichen.','Mit Honig beträufeln.'],
    'Toasted banana bread slices with almond butter and honey drizzle, food photography'),
  R('breakfast','Hüttenkäse mit Beeren und Honig','Leichter Hüttenkäse mit frischen Beeren — proteinreich und erfrischend.',5,0,1,['proteinreich','schnell','leicht'],
    [I('Hüttenkäse',200,'g',144,22,5,3.6,0,0.80),I('Gemischte Beeren',100,'g',40,1,9,0.3,3,1.00),I('Honig',1,'TL',22,0,6,0,0,0.10),I('Minze',3,'Blätter',0,0,0,0,0,0.05)],
    ['Hüttenkäse in Schale geben.','Beeren darauf verteilen.','Mit Honig und Minze garnieren.'],
    'Cottage cheese bowl with fresh berries, honey, mint, light breakfast, food photography'),
  R('breakfast','Buchweizen-Pancakes','Glutenfreie Pancakes aus Buchweizenmehl — nussig und sättigend.',10,10,2,['glutenfrei','vegetarisch'],
    [I('Buchweizenmehl',100,'g',343,13,72,3.4,10,0.50),I('Ei',1,'Stück',75,6,0.5,5,0,0.40),I('Hafermilch',150,'ml',68,0.5,10,2.3,0.6,0.30),I('Banane',1,'Stück',90,1,23,0.3,2.5,0.30),I('Ahornsirup',1,'EL',52,0,13,0,0,0.20)],
    ['Mehl, Ei, Milch und zerdrückte Banane verrühren.','Kleine Pancakes backen.','Mit Ahornsirup servieren.'],
    'Buckwheat pancakes stack with maple syrup and banana slices, food photography'),
  R('breakfast','Müesli Cups zum Mitnehmen','Vorbereitete Müesli-Cups mit Joghurt und Früchten — perfekt für unterwegs.',10,0,2,['mealprep','schnell'],
    [I('Griechischer Joghurt',300,'g',195,30,12,1.2,0,1.20),I('Haferflocken',60,'g',225,7.8,37.8,4.2,6,0.15),I('Honig',2,'TL',44,0,12,0,0,0.20),I('Beeren',100,'g',40,1,9,0.3,3,1.00)],
    ['Joghurt in zwei Gläser verteilen.','Haferflocken darüber schichten.','Beeren und Honig dazu, verschliessen.'],
    'Meal prep yogurt parfait cups with layers of granola and berries in glass jars, food photography'),
  R('breakfast','Avocado-Smoothie','Cremiger Smoothie mit Avocado, Banane und Spinat — sättigend und grün.',5,0,1,['vegan','grün'],
    [I('Avocado',0.5,'Stück',120,1.5,6,11,5,0.90),I('Banane',1,'Stück',90,1,23,0.3,2.5,0.30),I('Spinat',30,'g',7,0.9,0.4,0.1,0.7,0.20),I('Hafermilch',200,'ml',90,0.6,14,3,0.8,0.40)],
    ['Alles in den Mixer.','Cremig mixen.','Sofort geniessen.'],
    'Creamy green avocado smoothie in a glass, vibrant green, food photography'),
  R('breakfast','Zopf mit Butter und Konfitüre','Klassischer Schweizer Sonntagszopf — goldbraun und fluffig.',15,25,4,['schweiz','vegetarisch'],
    [I('Mehl',300,'g',1020,30,213,3,9,0.40),I('Butter',50,'g',359,0.4,0,40,0,0.40),I('Milch',100,'ml',47,3.3,4.8,1.5,0,0.15),I('Ei',1,'Stück',75,6,0.5,5,0,0.40),I('Hefe',10,'g',30,3.5,2,0.5,2,0.15),I('Erdbeerkonfitüre',30,'g',75,0.1,19,0,0.3,0.20)],
    ['Mehl, Butter, Milch, Ei und Hefe zu Teig verarbeiten.','1 Std. gehen lassen, flechten.','Bei 200°C 25 Min. goldbraun backen.','Mit Butter und Konfitüre servieren.'],
    'Swiss braided bread Zopf, golden brown, with butter and strawberry jam, food photography'),
  R('breakfast','Frühstücks-Burrito','Vollkorn-Tortilla gefüllt mit Rührei, Bohnen und Avocado.',10,10,1,['proteinreich'],
    [I('Vollkorn-Tortilla',1,'Stück',130,4,22,3,3,0.40),I('Eier',2,'Stück',150,12,1,10,0,0.80),I('Schwarze Bohnen',50,'g',65,4.5,9,0.3,3.8,0.20),I('Avocado',0.25,'Stück',60,0.8,3,5.5,2.5,0.45),I('Salsa',20,'g',6,0.2,1.2,0,0.3,0.10)],
    ['Eier verquirlen und als Rührei braten.','Tortilla erwärmen.','Mit Rührei, Bohnen, Avocado und Salsa füllen, einrollen.'],
    'Breakfast burrito cut in half, scrambled eggs, black beans, avocado, food photography'),
  R('breakfast','Quark-Auflauf mit Beeren','Warmer Quarkauflauf aus dem Ofen — wie Käsekuchen zum Frühstück.',10,25,2,['proteinreich','vegetarisch'],
    [I('Magerquark',300,'g',201,36,12,0.6,0,0.90),I('Eier',2,'Stück',150,12,1,10,0,0.80),I('Haferflocken',30,'g',113,3.9,18.9,2.1,3,0.08),I('Beeren',100,'g',40,1,9,0.3,3,1.00),I('Vanilleextrakt',1,'TL',12,0,0.5,0,0,0.10)],
    ['Quark, Eier, Haferflocken und Vanille verrühren.','In eine Auflaufform giessen.','Beeren darauf verteilen.','Bei 180°C 25 Min. backen.'],
    'Baked quark casserole with berries, golden top, breakfast, food photography'),
  R('breakfast','Türkisches Menemen','Eier pochiert in würziger Tomaten-Peperoni-Sauce — herzhaft und wärmend.',10,15,2,['vegetarisch','herzhaft'],
    [I('Eier',3,'Stück',225,18,1.5,15,0,1.20),I('Tomaten',200,'g',36,1.8,7,0.4,2.4,0.60),I('Peperoni',1,'Stück',30,1,6,0.2,2,0.50),I('Zwiebel',1,'Stück',40,1,9,0.1,1.5,0.20),I('Feta',30,'g',79,4.2,1.2,6.3,0,0.40)],
    ['Zwiebel und Peperoni in Olivenöl anbraten.','Tomaten dazu, 10 Min. köcheln.','Mulden formen, Eier einschlagen, zugedeckt stocken lassen.','Mit Feta servieren.'],
    'Turkish menemen shakshuka, eggs poached in tomato pepper sauce, feta, food photography'),

  // === LUNCH (12 neue) ===
  R('lunch','Griechischer Salat','Klassischer Bauernsalat mit Feta, Oliven und Oregano.',15,0,2,['vegetarisch','schnell','leicht'],
    [I('Gurke',200,'g',24,1.2,4,0.2,1,0.50),I('Tomaten',200,'g',36,1.8,7,0.4,2.4,0.60),I('Feta',100,'g',264,14,4,21,0,1.20),I('Oliven',30,'g',44,0.3,2,4,1,0.40),I('Olivenöl',2,'EL',216,0,0,24,0,0.30),I('Peperoni',1,'Stück',30,1,6,0.2,2,0.50)],
    ['Gurke, Tomaten und Peperoni würfeln.','Feta in grossen Stücken darauf legen.','Oliven dazu, mit Olivenöl und Oregano würzen.'],
    'Classic Greek salad with feta, olives, cucumber, tomatoes, olive oil, food photography'),
  R('lunch','Kürbissuppe mit Ingwer','Samtige Kürbissuppe — herbstlich, wärmend und voller Vitamine.',10,20,4,['vegan','saisonal'],
    [I('Kürbis (Hokkaido)',500,'g',130,5,30,0.5,5,1.50),I('Zwiebel',1,'Stück',40,1,9,0.1,1.5,0.20),I('Ingwer',10,'g',8,0.2,1.8,0.1,0.2,0.10),I('Kokosmilch',100,'ml',187,1.8,3,19,0,0.50),I('Kürbiskerne',20,'g',115,6,1,10,1,0.30)],
    ['Kürbis und Zwiebel in Olivenöl anbraten.','Ingwer dazu, mit Wasser aufgiessen.','20 Min. köcheln, pürieren.','Kokosmilch einrühren, mit Kürbiskernen servieren.'],
    'Creamy pumpkin soup with ginger, coconut cream swirl, pumpkin seeds, food photography'),
  R('lunch','Falafel-Bowl','Knusprige Falafel mit Hummus, Tabouleh und Tahini-Sauce.',20,15,2,['vegan','proteinreich'],
    [I('Kichererbsen (Dose)',400,'g',520,36,72,8,24,1.20),I('Petersilie',30,'g',11,0.9,1.9,0.2,1,0.30),I('Bulgur',80,'g',274,8.6,49,0.8,6.3,0.30),I('Tahini',20,'g',118,3.4,1.2,11,0.8,0.40),I('Zitronensaft',2,'EL',4,0.1,1.3,0,0,0.10),I('Tomaten',100,'g',18,0.9,3.5,0.2,1.2,0.30)],
    ['Kichererbsen mit Petersilie und Gewürzen pürieren, Bällchen formen.','Bei 200°C 15 Min. backen.','Bulgur mit Petersilie und Tomaten als Tabouleh.','Tahini-Dressing anrühren, alles in Bowls anrichten.'],
    'Falafel bowl with hummus, tabbouleh, tahini sauce, colorful, food photography'),
  R('lunch','Minestrone','Italienische Gemüsesuppe mit Pasta — herzhaft und ballaststoffreich.',10,25,4,['vegan','italienisch'],
    [I('Zucchetti',150,'g',25,1.8,4.5,0.5,1.5,0.50),I('Karotten',100,'g',41,0.9,9.5,0.2,2.8,0.20),I('Kartoffeln',150,'g',116,3,25.5,0.2,3.3,0.30),I('Bohnen (Dose)',200,'g',140,10,24,0.6,6,0.60),I('Ditalini Pasta',80,'g',280,10,56,1.2,2.4,0.30),I('Tomatenpassata',200,'ml',48,2,8,0.4,2.4,0.40)],
    ['Gemüse klein schneiden, in Olivenöl anbraten.','Passata und Wasser dazu, 15 Min. köcheln.','Pasta und Bohnen dazu, weitere 10 Min. kochen.'],
    'Italian minestrone soup with vegetables and pasta, hearty, food photography'),
  R('lunch','Lachs-Avocado-Poke Bowl','Hawaiianische Poke Bowl mit frischem Lachs und Avocado.',15,10,1,['proteinreich','omega3'],
    [I('Lachsfilet (frisch)',120,'g',250,24,0,17,0,3.00),I('Sushireis',80,'g',288,5.3,63,0.5,0.4,0.30),I('Avocado',0.5,'Stück',120,1.5,6,11,5,0.90),I('Edamame',50,'g',61,5.5,4,2.5,2.5,0.50),I('Sojasauce',1,'EL',8,1,0.8,0,0,0.05),I('Sesam',5,'g',29,0.9,0.6,2.5,0.6,0.05)],
    ['Reis kochen und abkühlen lassen.','Lachs in Würfel schneiden, mit Sojasauce marinieren.','Alles in einer Bowl anrichten.','Mit Sesam bestreuen.'],
    'Salmon poke bowl with avocado, edamame, rice, sesame, food photography'),
  R('lunch','Tomaten-Mozzarella-Sandwich','Knuspriges Ciabatta mit Tomaten, Mozzarella und Basilikum.',10,5,1,['vegetarisch','schnell','italienisch'],
    [I('Ciabatta',1,'Stück',200,7,38,2.5,2,0.60),I('Mozzarella',80,'g',202,14.4,0.8,15.2,0,0.80),I('Tomaten',100,'g',18,0.9,3.5,0.2,1.2,0.30),I('Basilikum',5,'Blätter',1,0,0.1,0,0.1,0.10),I('Pesto',15,'g',62,1,1.2,6,0.3,0.30)],
    ['Ciabatta halbieren und toasten.','Mit Pesto bestreichen.','Mozzarella, Tomaten und Basilikum belegen.'],
    'Caprese ciabatta sandwich with tomato, mozzarella, fresh basil, toasted, food photography'),
  R('lunch','Rotes Thai-Curry','Würziges rotes Curry mit Gemüse und Kokosmilch.',10,15,2,['vegan','asiatisch','scharf'],
    [I('Rote Currypaste',30,'g',52,1.2,5,3,1,0.40),I('Kokosmilch',200,'ml',374,3.6,6,38,0,1.00),I('Tofu',150,'g',143,15,2.3,8.3,0.3,0.90),I('Peperoni',1,'Stück',30,1,6,0.2,2,0.50),I('Bambussprossen',100,'g',27,2.6,3,0.3,2.2,0.40),I('Basmatireis',150,'g',540,10,117,1.5,1.5,0.40)],
    ['Currypaste in etwas Kokosmilch anrösten.','Tofu und Gemüse dazugeben.','Restliche Kokosmilch dazu, 10 Min. köcheln.','Mit Reis servieren.'],
    'Red Thai curry with tofu and vegetables, coconut milk, rice, food photography'),
  R('lunch','Caesar Salad mit Poulet','Knackiger Römersalat mit gegrilltem Poulet und Parmesan.',15,10,1,['proteinreich','klassisch'],
    [I('Romana-Salat',150,'g',25,1.8,3,0.5,3,0.60),I('Poulet-Brust',120,'g',132,25,0,2.8,0,1.50),I('Parmesan',20,'g',79,7,0.2,5.7,0,0.50),I('Croutons',20,'g',80,2,14,1.5,0.6,0.15),I('Caesar-Dressing',30,'ml',90,0.5,1.5,9,0,0.30)],
    ['Poulet-Brust grillieren und in Streifen schneiden.','Salat waschen, in Schüssel geben.','Poulet, Parmesan und Croutons darauf verteilen.','Mit Dressing beträufeln.'],
    'Caesar salad with grilled chicken, parmesan shavings, croutons, food photography'),
  R('lunch','Gazpacho','Kalte spanische Tomatensuppe — erfrischend an heissen Tagen.',15,0,4,['vegan','sommerlich','schnell'],
    [I('Tomaten',500,'g',90,4.5,17.5,1,6,1.50),I('Gurke',150,'g',18,0.9,3,0.1,0.8,0.40),I('Peperoni',1,'Stück',30,1,6,0.2,2,0.50),I('Knoblauch',1,'Zehe',4,0.2,1,0,0.1,0.05),I('Olivenöl',3,'EL',324,0,0,36,0,0.45)],
    ['Alles grob schneiden.','Im Mixer glatt pürieren.','Mit Salz, Pfeffer und Essig abschmecken.','Gekühlt servieren.'],
    'Spanish gazpacho cold soup in a bowl, red, olive oil drizzle, cucumber garnish, food photography'),
  R('lunch','Vietnamesische Pho','Aromatische Reisnudelsuppe mit frischen Kräutern.',15,20,2,['asiatisch','leicht'],
    [I('Reisnudeln',100,'g',360,3.4,80,0.6,1.6,0.50),I('Poulet-Brust',150,'g',165,31,0,3.5,0,1.80),I('Gemüsebrühe',800,'ml',24,2,4,0,0,0.20),I('Sojasprossen',80,'g',25,2.4,3.2,0.4,1.4,0.30),I('Thai-Basilikum',10,'g',2,0.2,0.3,0,0.3,0.20),I('Limette',1,'Stück',11,0.2,3.7,0.1,1,0.30)],
    ['Brühe aufkochen, Poulet darin garen.','Poulet herausnehmen und in Streifen schneiden.','Reisnudeln in der Brühe kochen.','Mit Poulet, Sprossen, Kräutern und Limette servieren.'],
    'Vietnamese pho noodle soup with herbs, lime, bean sprouts, food photography'),
  R('lunch','Wrap mit Halloumi und Gemüse','Gegrillter Halloumi mit frischem Gemüse im Wrap.',10,10,1,['vegetarisch','schnell'],
    [I('Vollkorn-Tortilla',1,'Stück',130,4,22,3,3,0.40),I('Halloumi',60,'g',198,14,1.2,15,0,1.20),I('Cherrytomaten',50,'g',9,0.4,2,0.1,0.6,0.30),I('Gurke',50,'g',6,0.3,1,0.1,0.3,0.15),I('Hummus',30,'g',50,2.3,4,3,1.2,0.20)],
    ['Halloumi in Scheiben schneiden und goldbraun braten.','Tortilla erwärmen, mit Hummus bestreichen.','Halloumi und Gemüse darauf, einrollen.'],
    'Grilled halloumi wrap with vegetables and hummus, food photography'),
  R('lunch','Kartoffel-Lauch-Suppe','Cremige Suppe aus Kartoffeln und Lauch — einfach und wohlig.',10,20,4,['vegetarisch','günstig','saisonal'],
    [I('Kartoffeln',400,'g',308,8,68,0.4,8.8,0.60),I('Lauch',200,'g',62,3,12,0.6,3.6,0.60),I('Gemüsebrühe',600,'ml',18,1.5,3,0,0,0.15),I('Rahm',50,'ml',170,1,1.5,18,0,0.30),I('Muskatnuss',1,'Prise',3,0,0.3,0.2,0.1,0.02)],
    ['Lauch und Kartoffeln klein schneiden, in Butter anbraten.','Brühe dazu, 20 Min. köcheln.','Pürieren, Rahm einrühren.','Mit Muskatnuss würzen.'],
    'Creamy potato leek soup, smooth, cream swirl, chives, food photography'),

  // === DINNER (12 neue) ===
  R('dinner','One-Pot Pasta Primavera','Alles aus einem Topf — Pasta mit frischem Frühlingsgemüse.',5,20,2,['vegetarisch','schnell'],
    [I('Spaghetti',200,'g',700,24,140,3,5.6,0.60),I('Cherrytomaten',150,'g',27,1.4,5.9,0.3,1.8,0.60),I('Zucchetti',150,'g',25,1.8,4.5,0.5,1.5,0.50),I('Erbsen',80,'g',65,4.4,9.4,0.3,4.2,0.40),I('Parmesan',30,'g',118,10,0.3,8.5,0,0.80)],
    ['Alle Zutaten in einen grossen Topf geben.','Mit Wasser bedecken, aufkochen.','12 Min. köcheln bis Pasta al dente.','Mit Parmesan servieren.'],
    'One pot pasta primavera with colorful vegetables, parmesan, food photography'),
  R('dinner','Shakshuka','Eier pochiert in würziger Tomatensauce — nordafrikanisch inspiriert.',10,20,2,['vegetarisch','proteinreich'],
    [I('Eier',4,'Stück',300,24,2,20,0,1.60),I('Tomaten (Dose)',400,'g',72,3.6,14,0.8,4.8,0.60),I('Zwiebel',1,'Stück',40,1,9,0.1,1.5,0.20),I('Peperoni',1,'Stück',30,1,6,0.2,2,0.50),I('Kreuzkümmel',1,'TL',8,0.4,0.9,0.5,0.2,0.05),I('Feta',40,'g',106,5.6,1.6,8.4,0,0.50)],
    ['Zwiebel und Peperoni in Olivenöl braten.','Tomaten und Gewürze dazu, 10 Min. köcheln.','Mulden formen, Eier einschlagen.','Zugedeckt 8 Min. stocken lassen, mit Feta servieren.'],
    'Shakshuka eggs in spicy tomato sauce with feta, cast iron pan, food photography'),
  R('dinner','Risotto mit Pilzen','Cremiges Risotto mit Champignons und Parmesan.',10,25,2,['vegetarisch','italienisch'],
    [I('Risottoreis',200,'g',700,14,152,1.4,2,0.80),I('Champignons',200,'g',44,6.2,0.6,0.4,2,1.00),I('Gemüsebrühe',600,'ml',18,1.5,3,0,0,0.15),I('Parmesan',40,'g',157,13.3,0.4,11.3,0,1.00),I('Zwiebel',1,'Stück',40,1,9,0.1,1.5,0.20),I('Butter',20,'g',144,0.2,0,16,0,0.15)],
    ['Zwiebel in Butter glasig dünsten, Reis dazugeben.','Brühe nach und nach einrühren.','Pilze separat braten, zum Risotto geben.','Parmesan unterrühren.'],
    'Creamy mushroom risotto with parmesan, fresh herbs, food photography'),
  R('dinner','Teriyaki-Lachs mit Gemüse','Glasierter Lachs mit süss-salziger Teriyaki-Sauce und Gemüse.',10,15,2,['asiatisch','proteinreich','omega3'],
    [I('Lachsfilet',300,'g',624,60,0,42,0,5.00),I('Sojasauce',3,'EL',24,3,2.3,0,0,0.15),I('Honig',1,'EL',66,0.1,18,0,0,0.10),I('Ingwer',5,'g',4,0.1,0.9,0,0.1,0.05),I('Brokkoli',200,'g',68,5.6,10.4,0.6,5.2,0.80),I('Basmatireis',150,'g',540,10,117,1.5,1.5,0.40)],
    ['Sojasauce, Honig und Ingwer zur Teriyaki-Sauce mischen.','Lachs damit einpinseln, 4 Min. pro Seite braten.','Brokkoli dämpfen.','Mit Reis servieren.'],
    'Teriyaki glazed salmon with steamed broccoli and rice, food photography'),
  R('dinner','Auberginen-Parmigiana','Geschichtete Auberginen mit Tomatensauce und Mozzarella überbacken.',15,35,4,['vegetarisch','italienisch'],
    [I('Auberginen',500,'g',125,6.5,15.5,1,15,1.50),I('Tomatenpassata',300,'ml',72,3,12,0.6,3.6,0.60),I('Mozzarella',150,'g',380,27,1.5,28.5,0,1.50),I('Parmesan',30,'g',118,10,0.3,8.5,0,0.80),I('Basilikum',10,'g',2,0.3,0.3,0.1,0.2,0.20)],
    ['Auberginen in Scheiben schneiden, salzen, 15 Min. ruhen lassen.','In einer Pfanne goldbraun braten.','Schichten: Sauce, Auberginen, Mozzarella. Wiederholen.','Bei 190°C 30 Min. überbacken.'],
    'Eggplant parmigiana, layers of aubergine, tomato sauce, melted mozzarella, food photography'),
  R('dinner','Poulet-Geschnetzeltes mit Champignons','Schweizer Poulet-Geschnetzeltes in Rahmsauce — leichtere Variante.',10,15,2,['schweiz','proteinreich'],
    [I('Poulet-Brust',300,'g',330,62,0,7,0,3.50),I('Champignons',200,'g',44,6.2,0.6,0.4,2,1.00),I('Rahm',100,'ml',340,2,3,36,0,0.60),I('Zwiebel',1,'Stück',40,1,9,0.1,1.5,0.20),I('Reis',150,'g',540,10,117,1.5,1.5,0.40)],
    ['Poulet in Streifen schneiden, anbraten.','Champignons und Zwiebel dazugeben.','Mit Rahm ablöschen, 10 Min. köcheln.','Mit Reis servieren.'],
    'Swiss style chicken stroganoff with mushrooms, cream sauce, rice, food photography'),
  R('dinner','Buddha Bowl mit Süsskartoffel','Nährende Bowl mit gerösteter Süsskartoffel, Kichererbsen und Tahini.',10,25,2,['vegan','ballaststoffreich'],
    [I('Süsskartoffel',300,'g',258,4.8,60,0.3,9,1.20),I('Kichererbsen',200,'g',260,18,36,4,12,0.60),I('Spinat',80,'g',18,2.3,1.4,0.3,1.8,0.60),I('Avocado',0.5,'Stück',120,1.5,6,11,5,0.90),I('Tahini',20,'g',118,3.4,1.2,11,0.8,0.40)],
    ['Süsskartoffel würfeln, mit Kichererbsen bei 200°C rösten.','Tahini-Dressing anrühren.','In Bowls mit Spinat und Avocado anrichten.'],
    'Buddha bowl with roasted sweet potato, chickpeas, avocado, tahini, food photography'),
  R('dinner','Spaghetti Carbonara (leicht)','Klassische Carbonara mit weniger Rahm — dafür mehr Geschmack.',10,15,2,['proteinreich','italienisch'],
    [I('Spaghetti',200,'g',700,24,140,3,5.6,0.60),I('Pancetta',50,'g',166,7.5,0,15,0,1.00),I('Eier',2,'Stück',150,12,1,10,0,0.80),I('Parmesan',40,'g',157,13.3,0.4,11.3,0,1.00),I('Pfeffer',1,'TL',5,0.2,1.3,0.1,0.5,0.05)],
    ['Spaghetti al dente kochen.','Pancetta knusprig braten.','Eier mit Parmesan verquirlen.','Heisse Pasta mit Ei-Käse-Mischung vermengen, Pancetta dazu.'],
    'Spaghetti carbonara with crispy pancetta, parmesan, black pepper, food photography'),
  R('dinner','Blumenkohl-Curry','Würziges Curry mit Blumenkohl und Kichererbsen — vegan und sättigend.',10,20,2,['vegan','asiatisch','günstig'],
    [I('Blumenkohl',300,'g',75,6,14.1,0.9,6,1.20),I('Kichererbsen (Dose)',200,'g',260,18,36,4,12,0.60),I('Kokosmilch',200,'ml',374,3.6,6,38,0,1.00),I('Currypulver',2,'TL',14,0.6,2.4,0.6,1,0.10),I('Basmatireis',150,'g',540,10,117,1.5,1.5,0.40)],
    ['Blumenkohl in Röschen teilen.','Mit Currypulver in Öl anrösten.','Kokosmilch und Kichererbsen dazu, 15 Min. köcheln.','Mit Reis servieren.'],
    'Cauliflower chickpea curry with coconut milk and rice, food photography'),
  R('dinner','Zucchetti-Lasagne','Lasagne mit Zucchetti-Scheiben statt Pasta — leicht und low carb.',15,30,4,['lowcarb','vegetarisch'],
    [I('Zucchetti',500,'g',85,6,14.5,1.5,5,1.50),I('Ricotta',250,'g',430,28,7.5,31,0,1.50),I('Tomatenpassata',300,'ml',72,3,12,0.6,3.6,0.60),I('Mozzarella',150,'g',380,27,1.5,28.5,0,1.50),I('Parmesan',30,'g',118,10,0.3,8.5,0,0.80)],
    ['Zucchetti der Länge nach in dünne Scheiben schneiden.','Schichten: Passata, Zucchetti, Ricotta. Wiederholen.','Mozzarella und Parmesan obendrauf.','Bei 190°C 30 Min. backen.'],
    'Zucchini lasagna layers with ricotta, tomato sauce, melted cheese, food photography'),
  R('dinner','Linsendal mit Naan','Indisches Linsengericht mit selbstgemachtem Naan-Brot.',10,25,4,['vegan','indisch','günstig'],
    [I('Rote Linsen',200,'g',680,50,112,3.2,22.4,0.80),I('Tomaten (Dose)',400,'g',72,3.6,14,0.8,4.8,0.60),I('Zwiebel',1,'Stück',40,1,9,0.1,1.5,0.20),I('Kurkuma',1,'TL',8,0.3,1.4,0.2,0.5,0.10),I('Naan-Brot',4,'Stück',800,24,136,12,4,2.00)],
    ['Zwiebel anbraten, Kurkuma und Gewürze dazu.','Linsen und Tomaten hinzufügen, 20 Min. köcheln.','Pürieren für cremige Konsistenz.','Mit warmem Naan servieren.'],
    'Indian dal lentil curry with naan bread, golden, food photography'),
  R('dinner','Ofengemüse mit Feta','Buntes Ofengemüse mit zerbröseltem Feta — einfach und köstlich.',10,30,2,['vegetarisch','saisonal','einfach'],
    [I('Süsskartoffel',200,'g',172,3.2,40,0.2,6,0.80),I('Peperoni',2,'Stück',60,2,12,0.4,4,1.00),I('Zucchetti',150,'g',25,1.8,4.5,0.5,1.5,0.50),I('Cherrytomaten',150,'g',27,1.4,5.9,0.3,1.8,0.60),I('Feta',100,'g',264,14,4,21,0,1.20),I('Olivenöl',2,'EL',216,0,0,24,0,0.30)],
    ['Gemüse würfeln, mit Olivenöl und Kräutern mischen.','Bei 200°C 25 Min. rösten.','Feta darüber bröseln, nochmals 5 Min. backen.'],
    'Roasted vegetables with crumbled feta on baking sheet, colorful, food photography'),

  // === SNACK (8 neue) ===
  R('snack','Geröstete Kichererbsen','Knusprig geröstete Kichererbsen mit Paprika — der proteinreiche Knusper-Snack.',5,25,2,['vegan','proteinreich'],
    [I('Kichererbsen (Dose)',400,'g',520,36,72,8,24,1.20),I('Olivenöl',1,'EL',108,0,0,12,0,0.15),I('Paprikapulver',1,'TL',6,0.3,1.1,0.3,0.5,0.05)],
    ['Kichererbsen abspülen und trocken tupfen.','Mit Öl und Paprika mischen.','Bei 200°C 25 Min. rösten bis knusprig.'],
    'Crispy roasted chickpeas in a bowl, paprika seasoned, snack, food photography'),
  R('snack','Bananen-Hafer-Cookies','Gesunde Cookies aus nur 2 Zutaten — ohne Zucker.',10,15,8,['vegan','zuckerfrei'],
    [I('Bananen (reif)',2,'Stück',180,2,46,0.6,5,0.60),I('Haferflocken',100,'g',375,13,63,7,10,0.25)],
    ['Bananen zerdrücken, Haferflocken untermischen.','Kleine Häufchen auf Backblech setzen.','Bei 180°C 15 Min. backen.'],
    'Healthy banana oat cookies on baking sheet, golden, simple, food photography'),
  R('snack','Gemüse-Chips aus dem Ofen','Knusprige Chips aus Randen, Süsskartoffel und Rüebli.',10,20,2,['vegan','glutenfrei'],
    [I('Randen',100,'g',43,1.6,9.6,0.2,2.8,0.30),I('Süsskartoffel',100,'g',86,1.6,20,0.1,3,0.40),I('Rüebli',100,'g',41,0.9,9.5,0.2,2.8,0.20),I('Olivenöl',1,'EL',108,0,0,12,0,0.15)],
    ['Gemüse in sehr dünne Scheiben schneiden.','Mit Öl bepinseln, salzen.','Bei 160°C ca. 20 Min. knusprig backen.'],
    'Colorful vegetable chips from beets, sweet potato, carrots, food photography'),
  R('snack','Frozen Banana Pops','Gefrorene Banane in Schokolade mit Nüssen — wie Glace, aber gesünder.',10,30,4,['vegetarisch','leicht'],
    [I('Bananen',2,'Stück',180,2,46,0.6,5,0.60),I('Dunkle Schokolade',50,'g',285,3.7,23,20,5,0.70),I('Gehackte Nüsse',20,'g',120,4,3,11,1.5,0.40)],
    ['Bananen halbieren, Holzspiess reinstecken.','Schokolade schmelzen, Bananen eintauchen.','Mit Nüssen bestreuen, 30 Min. einfrieren.'],
    'Frozen chocolate covered banana pops with nuts, food photography'),
  R('snack','Käse-Kräuter-Muffins','Herzhafte Muffins mit Käse und Kräutern — perfekt zum Mitnehmen.',10,20,6,['vegetarisch','mealprep'],
    [I('Mehl',150,'g',510,15,106,1.5,4.5,0.25),I('Eier',2,'Stück',150,12,1,10,0,0.80),I('Milch',100,'ml',47,3.3,4.8,1.5,0,0.15),I('Gruyère',60,'g',240,17,0.4,18.6,0,1.00),I('Schnittlauch',10,'g',3,0.3,0.4,0.1,0.3,0.10)],
    ['Mehl, Eier und Milch verrühren.','Geriebenen Käse und Kräuter unterheben.','In Muffinform füllen.','Bei 180°C 20 Min. backen.'],
    'Savory cheese herb muffins, golden, rustic, food photography'),
  R('snack','Trail Mix','Selbstgemischter Trail Mix mit Nüssen, Kernen und Trockenfrüchten.',5,0,4,['vegan','schnell','energie'],
    [I('Mandeln',40,'g',232,8.4,1.6,20,5,0.60),I('Cashews',30,'g',165,5.4,8.7,13.2,0.9,0.50),I('Kürbiskerne',20,'g',115,6,1,10,1,0.30),I('Cranberries (getr.)',20,'g',62,0,16,0.3,1,0.20),I('Dunkle Schoko-Drops',15,'g',82,1,8,5.5,1.5,0.20)],
    ['Alle Zutaten mischen.','In kleine Portionen aufteilen.','Kühl aufbewahren.'],
    'Trail mix with nuts, seeds, dried cranberries, chocolate chips, food photography'),
  R('snack','Reiswaffeln mit Avocado','Knusprige Reiswaffeln mit Avocado und Sesam — leicht und schnell.',5,0,1,['vegan','schnell'],
    [I('Reiswaffeln',3,'Stück',70,1.5,15.5,0.5,0.5,0.20),I('Avocado',0.5,'Stück',120,1.5,6,11,5,0.90),I('Sesam',5,'g',29,0.9,0.6,2.5,0.6,0.05),I('Sojasauce',1,'TL',3,0.3,0.3,0,0,0.02)],
    ['Avocado zerdrücken und auf Reiswaffeln streichen.','Mit Sesam und einem Spritzer Sojasauce toppen.'],
    'Rice cakes with mashed avocado and sesame seeds, snack, food photography'),
  R('snack','Frozen Joghurt Bites','Kleine gefrorene Joghurt-Tropfen mit Beeren — der coole Snack.',10,60,4,['vegetarisch','leicht'],
    [I('Griechischer Joghurt',200,'g',130,20,8,0.8,0,0.80),I('Honig',1,'EL',66,0.1,18,0,0,0.10),I('Beeren',50,'g',20,0.5,4.5,0.2,1.5,0.50)],
    ['Joghurt mit Honig mischen.','Kleine Tropfen auf Backpapier setzen.','Je 1 Beere reindrücken.','Mindestens 1 Std. einfrieren.'],
    'Frozen yogurt bites with berries on parchment paper, food photography'),

  // === DESSERT (8 neue) ===
  R('dessert','Tiramisu (leicht)','Italienisches Tiramisu mit weniger Zucker — genauso himmlisch.',20,0,6,['vegetarisch','italienisch'],
    [I('Mascarpone',250,'g',1050,6,1,112,0,2.50),I('Eier',3,'Stück',225,18,1.5,15,0,1.20),I('Löffelbiskuit',100,'g',392,8,72,8,1.2,0.80),I('Espresso',200,'ml',4,0.2,0.8,0,0,0.30),I('Kakaopulver',10,'g',25,2,2.7,1,3,0.15)],
    ['Eier trennen, Eigelb mit Mascarpone verrühren.','Eiweiss steif schlagen, unterheben.','Biskuits in Espresso tauchen, schichten.','Mascarpone-Creme darauf, wiederholen.','Über Nacht kühlen, mit Kakao bestäuben.'],
    'Italian tiramisu in a glass dish, cocoa powder dusted, layers visible, food photography'),
  R('dessert','Apfelcrumble','Warmer Apfelcrumble mit Vanilleglace — Schweizer Herbstklassiker.',15,25,4,['vegetarisch','saisonal'],
    [I('Äpfel',500,'g',260,1.5,70,1,12,1.50),I('Haferflocken',80,'g',300,10.4,50.4,5.6,8,0.20),I('Butter',40,'g',288,0.3,0,32,0,0.30),I('Zimt',1,'TL',6,0.1,1.5,0,1.3,0.05),I('Vanilleglace',4,'Kugeln',400,4,48,20,0,2.00)],
    ['Äpfel schälen, in Stücke schneiden, mit Zimt mischen.','Haferflocken mit zerlassener Butter vermengen.','Äpfel in Form, Crumble darüber.','Bei 180°C 25 Min. backen, mit Glace servieren.'],
    'Warm apple crumble with vanilla ice cream scoop, cinnamon, food photography'),
  R('dessert','Schoko-Avocado-Mousse','Vegane Mousse aus Avocado und Kakao — cremig ohne Rahm.',10,0,4,['vegan','glutenfrei'],
    [I('Avocados (reif)',2,'Stück',480,6,24,44,20,1.80),I('Kakaopulver',30,'g',76,6,8.1,3,9,0.40),I('Ahornsirup',3,'EL',156,0,40.2,0,0,0.60),I('Vanilleextrakt',1,'TL',12,0,0.5,0,0,0.10)],
    ['Avocados mit allen Zutaten im Mixer pürieren.','Cremig mixen bis glatt.','In Gläser füllen, 1 Std. kühlen.'],
    'Chocolate avocado mousse in glasses, rich and creamy, vegan dessert, food photography'),
  R('dessert','Erdbeer-Rhabarber-Kompott','Sommerliches Kompott mit Joghurt — natürlich süss.',10,15,4,['vegetarisch','saisonal','leicht'],
    [I('Erdbeeren',300,'g',96,2.1,23.1,0.9,6,1.50),I('Rhabarber',200,'g',42,1.8,5.2,0.4,3.6,0.60),I('Zucker',40,'g',160,0,40,0,0,0.05),I('Griechischer Joghurt',200,'g',130,20,8,0.8,0,0.80)],
    ['Rhabarber in Stücke schneiden, mit Zucker aufkochen.','Erdbeeren dazugeben, 5 Min. köcheln.','Abkühlen lassen.','Mit Joghurt servieren.'],
    'Strawberry rhubarb compote in a bowl with yogurt, summer dessert, food photography'),
  R('dessert','Kokos-Panna-Cotta','Vegane Panna Cotta mit Kokosmilch und Passionsfrucht.',10,5,4,['vegan','glutenfrei','tropisch'],
    [I('Kokosmilch',400,'ml',748,7.2,12,76,0,2.00),I('Agar-Agar',2,'g',0,0,0,0,0,0.20),I('Ahornsirup',2,'EL',104,0,26.8,0,0,0.40),I('Passionsfrucht',2,'Stück',34,0.8,8.4,0.2,4,1.00)],
    ['Kokosmilch mit Agar-Agar und Ahornsirup erhitzen.','2 Min. köcheln lassen.','In Förmchen giessen, 4 Std. kühlen.','Mit Passionsfrucht servieren.'],
    'Coconut panna cotta with passion fruit topping, tropical dessert, food photography'),
  R('dessert','Zitronen-Tarte','Frische Zitronentarte mit butterigem Mürbeteig.',20,30,8,['vegetarisch','elegant'],
    [I('Mehl',200,'g',680,18,142,2,6,0.40),I('Butter',100,'g',717,0.7,0,81,0,0.80),I('Zitronen',3,'Stück',51,1.8,16.2,0.6,4.8,0.90),I('Eier',3,'Stück',225,18,1.5,15,0,1.20),I('Zucker',100,'g',400,0,100,0,0,0.10)],
    ['Mürbeteig aus Mehl, Butter und Zucker, 30 Min. kühlen.','In Tarteform drücken, blindbacken 15 Min.','Zitronencreme aus Saft, Eiern und Zucker kochen.','In Tarte füllen, kühlen.'],
    'Lemon tart with powdered sugar, elegant French patisserie style, food photography'),
  R('dessert','Chia-Kokos-Pudding mit Mango','Tropischer Chia-Pudding mit Kokosmilch und frischer Mango.',5,0,2,['vegan','glutenfrei'],
    [I('Chiasamen',40,'g',193,6.7,16,12,13.3,0.70),I('Kokosmilch',300,'ml',561,5.4,9,57,0,1.50),I('Mango',150,'g',90,1.2,22.5,0.6,2.4,1.20),I('Limettensaft',1,'EL',3,0,0.9,0,0,0.05)],
    ['Chiasamen mit Kokosmilch verrühren.','Über Nacht kühlen.','Mit frischer Mango und Limette servieren.'],
    'Chia coconut pudding with fresh mango cubes, tropical, food photography'),
  R('dessert','Griessbrei mit Kirschen','Warmer Griessbrei wie bei Grossmutter — mit heissen Kirschen.',5,15,2,['vegetarisch','comfort'],
    [I('Griess',60,'g',212,6.4,43,0.7,1.8,0.20),I('Milch',400,'ml',188,13.2,19.2,6,0,0.60),I('Zucker',20,'g',80,0,20,0,0,0.03),I('Kirschen (Glas)',200,'g',120,1.2,28,0.2,1.6,1.00),I('Vanillezucker',1,'Päckchen',30,0,7.5,0,0,0.10)],
    ['Milch mit Zucker und Vanille aufkochen.','Griess einrühren, unter Rühren 3 Min. köcheln.','Kirschen erwärmen.','Griessbrei mit heissen Kirschen servieren.'],
    'Warm semolina pudding with cherry compote, comfort dessert, food photography'),

  // === SMOOTHIE (6 neue) ===
  R('smoothie','Golden Milk Smoothie','Goldene Milch als Smoothie — mit Kurkuma, Ingwer und Banane.',5,0,1,['vegan','entzündungshemmend'],
    [I('Banane',1,'Stück',90,1,23,0.3,2.5,0.30),I('Kurkuma',1,'TL',8,0.3,1.4,0.2,0.5,0.05),I('Ingwer',5,'g',4,0.1,0.9,0,0.1,0.05),I('Hafermilch',200,'ml',90,0.6,14,3,0.8,0.40),I('Honig',1,'TL',22,0,6,0,0,0.10)],
    ['Alles in den Mixer.','Cremig mixen.','Warm oder kalt geniessen.'],
    'Golden turmeric milk smoothie, vibrant yellow, warm tones, food photography'),
  R('smoothie','Kiwi-Minze-Smoothie','Erfrischender grüner Smoothie mit Kiwi und Minze.',5,0,1,['vegan','erfrischend'],
    [I('Kiwi',2,'Stück',84,1.6,20.4,0.8,4.2,0.60),I('Banane',0.5,'Stück',45,0.5,11.5,0.2,1.3,0.15),I('Minze',10,'Blätter',2,0.1,0.3,0,0.2,0.10),I('Wasser',150,'ml',0,0,0,0,0,0)],
    ['Kiwis schälen, alles in den Mixer.','Glatt mixen.','Sofort servieren.'],
    'Kiwi mint smoothie, bright green, ice cubes, refreshing, food photography'),
  R('smoothie','Himbeer-Kokos-Smoothie','Rosa Smoothie mit Himbeeren und Kokosmilch.',5,0,1,['vegan','tropisch'],
    [I('Himbeeren (TK)',150,'g',62,1.8,7.5,0.9,9.8,1.00),I('Kokosmilch',100,'ml',187,1.8,3,19,0,0.50),I('Banane',0.5,'Stück',45,0.5,11.5,0.2,1.3,0.15),I('Haferflocken',15,'g',56,1.9,9.5,1.1,1.5,0.04)],
    ['Alles in den Mixer.','Cremig mixen.','Sofort geniessen.'],
    'Pink raspberry coconut smoothie in a glass, beautiful color, food photography'),
  R('smoothie','Erdnuss-Bananen-Shake','Proteinreicher Shake mit Erdnussbutter und Banane — nach dem Sport.',5,0,1,['proteinreich','fitness'],
    [I('Banane',1,'Stück',90,1,23,0.3,2.5,0.30),I('Erdnussbutter',25,'g',147,6.3,3.3,12.5,2,0.40),I('Magerquark',100,'g',67,12,4,0.2,0,0.40),I('Hafermilch',200,'ml',90,0.6,14,3,0.8,0.40)],
    ['Alles in den Mixer.','30 Sekunden cremig mixen.','Sofort trinken.'],
    'Peanut butter banana protein shake in glass, creamy, food photography'),
  R('smoothie','Wassermelonen-Smoothie','Sommerlicher Smoothie aus frischer Wassermelone — ultra erfrischend.',5,0,2,['vegan','sommerlich','leicht'],
    [I('Wassermelone',300,'g',90,1.8,22.5,0.5,1.2,0.80),I('Limettensaft',1,'EL',3,0,0.9,0,0,0.05),I('Minze',5,'Blätter',1,0,0.1,0,0.1,0.05),I('Eiswürfel',5,'Stück',0,0,0,0,0,0)],
    ['Wassermelone entkernen und würfeln.','Mit Limette, Minze und Eis mixen.','Sofort servieren.'],
    'Watermelon smoothie, bright pink, mint garnish, summer drink, food photography'),
  R('smoothie','Matcha-Smoothie','Japanischer Matcha-Smoothie mit Banane — sanft energetisierend.',5,0,1,['vegan','superfood'],
    [I('Matcha-Pulver',2,'g',6,0.6,0.8,0.1,0.8,0.50),I('Banane',1,'Stück',90,1,23,0.3,2.5,0.30),I('Hafermilch',200,'ml',90,0.6,14,3,0.8,0.40),I('Honig',1,'TL',22,0,6,0,0,0.10)],
    ['Matcha-Pulver mit wenig warmem Wasser auflösen.','Banane und Hafermilch dazugeben.','Cremig mixen.'],
    'Matcha green smoothie in a glass, vibrant green, Japanese style, food photography'),
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
