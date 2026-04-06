# CLAUDE.md — SpicyHealth

Dieses Dokument beschreibt die Zusammenarbeit zwischen Claude (KI-Entwicklerassistent) und dem SpicyHealth-Team.

---

## Zusammenarbeit & Kommunikation

**Franziska** ist die Projektbesitzerin und Hauptnutzerin. Sie gibt Ideen, Feedback und Prioritäten vor.
**Daniele** (GitHub: bluebossa63) ist der technische Administrator.

**Wie Claude mit Franziska arbeitet:**
- Immer auf Deutsch, ohne Fachbegriffe
- Kurz erklären was geplant ist, dann auf Bestätigung warten
- Technische Umsetzung läuft im Hintergrund — keine Anweisungen an Franziska
- Nie nach Passwörtern fragen (alle Zugangsdaten sind in `~/.openclaw-secrets`)
- Vorschläge machen, Prioritäten von Franziska bestimmen lassen
- Nach jedem Deploy kurz bestätigen dass alles live ist

---

## Businessziel

SpicyHealth ist eine **Gesundheits- und Lifestyle-App für Frauen**, die Ernährung, Wohlbefinden und persönlichen Stil verbindet. Die App soll Frauen motivieren, täglich kleine gesunde Gewohnheiten aufzubauen — spielerisch, schön und ohne Verzicht.

**Kernversprechen:** In 10 Minuten pro Tag gesünder leben.

**Zielgruppe:** Frauen 30–55 Jahre, gesundheitsbewusst, möchten mehr aus ihrem Alltag machen.

**Designsprache:** Bridgerton/Regency-inspiriert — zartes Blush, Salbeigrün, Terrakotta, Crème. Schriftart Playfair Display. Verspielt und feminin, aber modern.

---

## Features & Seiten

| Seite | Beschreibung |
|-------|-------------|
| `/` | Startseite mit Rezept-Vorschau und Nutzerversprechen |
| `/recipes` | Rezeptbibliothek mit Suche, Filter, Nährwertanzeige |
| `/meal-planner` | Wöchentlicher Mahlzeitenplaner (Drag & Drop) |
| `/shopping-list` | Einkaufsliste (automatisch aus Wochenplan) |
| `/umstyling` | KI-Stilberaterin (Chat + Foto-Umstyling) |
| `/mein-tag` | Wasser-Tracker, Stimmung, Energie, Schlaf, Notiz |
| `/fortschritt` | 30-Tage-Verlauf Wasser & Wohlbefinden |
| `/saisonkalender` | Saisonale Lebensmittel nach Monat |
| `/profile` | Profil, Diätpräferenzen, Stilvorlieben, Passwort |
| `/willkommen` | Onboarding für neue Nutzerinnen |
| `/auth` | Login, Registrierung, Google OAuth, Callback |

---

## Architektur

### Monorepo-Struktur
```
spicyhealth/
├── apps/
│   ├── web/          → Next.js 14 Frontend (Static Export)
│   └── api/          → Express.js Backend API
└── packages/
    └── shared/       → Gemeinsame TypeScript-Typen
```

### Frontend (apps/web)
- **Framework:** Next.js 14 mit Static Export (`output: 'export'`)
- **Hosting:** Azure Static Web Apps
- **Styling:** Tailwind CSS mit eigenem Farbschema
- **Auth:** JWT im localStorage, Google OAuth via Backend

### Backend (apps/api)
- **Framework:** Express.js mit TypeScript
- **Hosting:** Azure App Service (`spicyhealth-api-prod`)
- **Port:** 8080 (Azure Standard)
- **Auth:** JWT + Google OIDC

### Datenbank & Speicher
- **Datenbank:** Azure Cosmos DB (`spicyhealth`)
  - Container: `recipes`, `users`, `meal-plans`, `shopping-lists`, `daily-logs`, `comments`
- **Bilder:** Azure Blob Storage (`spicyhealthmediaprod`)
  - Container für Rezeptbilder, Nutzer-Avatare

### KI-Services
| Service | Verwendung |
|---------|-----------|
| Anthropic Claude | Stilberaterin Chat (System-Prompt serverseitig) |
| OpenAI DALL-E 3 | Rezeptbilder generieren |
| fal.ai Flux Kontext | Foto-Umstyling (Outfit/Makeup/Frisur auf Foto) |
| FASHN.ai | Virtual Try-On (Kleidungsstück auf Foto) |
| Unsplash API | Rezeptfotos importieren |

### Deployment
- **Trigger:** Push auf `main` → GitHub Actions
- **Dauer:** ~3-5 Minuten
- **Workflow:** `.github/workflows/deploy.yml`
- Buildet shared → api → web, deployt beides parallel

---

## Zugangsdaten

Alle Keys und Secrets liegen in `~/.openclaw-secrets`. Nie ins Git committen.

Wichtige Variablen:
- `ANTHROPIC_API_KEY` — Stilberaterin
- `OPENAI_API_KEY` — DALL-E 3 Bildgenerierung
- `FAL_API_KEY` — Flux Kontext Foto-Editing
- `FASHN_API_KEY` — Virtual Try-On
- `UNSPLASH_ACCESS_KEY` — Rezeptfotos importieren

---

## Bekannte Eigenheiten

- `NEXT_PUBLIC_API_URL` wird beim Frontend-Build in GitHub Actions gesetzt (nicht lokal)
- Bilder: SAS-Token Ablauf 1 Stunde → für Produktion ggf. verlängern
- Anti-Aging-Regel in Flux-Prompts ist wichtig: Gesicht darf nicht älter werden
- Onboarding-Flag `spicyhealth_onboarded` im localStorage verhindert Wiederholung
- Erinnerungen (Wasser/Mahlzeiten): `spicyhealth_reminders` im localStorage

---

## Aktueller Sprint (S9) — Stand April 2026

- ✅ S9-01: CORS-Konfiguration
- ✅ S9-02: Umlaut-Suche (ä/ö/ü)
- ✅ S9-03: Keine hardcodierten Credentials
- ✅ S9-04: Unsplash Foto-Import für Rezepte
- 🔄 Mehr Rezepte (Ziel: 200+, aktuell ~99)

---

## Nächste mögliche Features (Vorschläge)

- Rezeptkommentare / Bewertungen sichtbar machen
- Wochenplan als PDF drucken / teilen
- Einkaufsliste nach Supermarkt-Gängen sortieren
- Push-Benachrichtigungen für Wasser-Erinnerungen (Service Worker)
- Saisonkalender mit passenden Rezepten verknüpfen
