# Plan My Keralam: Website Plan (draft for approval)

Status: APPROVED (recommendations accepted). Version 1 built; see README.md.
Source data: kerala-foreigner-travel-guide-data.md (compiled 22 Nov 2026)

## 1. Goal
A single website where a foreign first-time visitor can plan a whole Kerala trip:
decide if and when to go, get the visa, choose places, build an itinerary, estimate a budget,
and carry a safety and etiquette guide on their phone.

Who it's for: international visitors (US, UK, EU, Australia, Gulf), mostly planning on a phone, 2–6 months before travel.

## 2. The core idea: the Trip Planner
Every page links back to one tool, "Plan My Trip":
1. Travel dates (or month) -> season check (peak / summer / monsoon) and festivals on those dates
2. Trip length (5 / 7 / 10 / 14 / 21 days)
3. Interests (backwaters, beaches, hills, wildlife, culture, Ayurveda, food, adventure)
4. Pace and budget (budget / mid-range / luxury)
5. Nationality -> visa type, fee and the per-stay limit
Output: a day-by-day itinerary, budget estimate (INR + USD/EUR/GBP), packing list, visa checklist,
festivals during the trip. Saved in the browser, printable, shareable by link. No account needed.

## 3. Sitemap
| # | Page | Purpose |
|---|---|---|
| 1 | Home | Hero, season-now badge, "Start planning" button, top 10, quick links |
| 2 | Plan My Trip | 5-step planner wizard -> personal itinerary |
| 3 | My Trip | Saved itinerary, checklist, budget, print/share |
| 4 | Before You Go | e-Visa step-by-step, e-Arrival card, insurance, health, packing |
| 5 | When to Go | Month-by-month climate (°C/°F, mm/in), crowds, best-for |
| 6 | Destinations | Map + filter cards (category, region, district) |
| 6a | Destination detail | About, best time, how to get there, time needed, nearby, map |
| 7 | Experiences | Houseboats, Ayurveda, art forms, plantations, village life, adventure |
| 8 | Festivals & Events | Month calendar, Theyyam season band, "add to my trip" |
| 9 | Food Guide | Dishes with spice level, veg tags, Sadya etiquette |
| 10 | Itineraries | Ready-made 7 / 10 / 14 days + wellness, each "load into planner" |
| 11 | Getting There & Around | Airports, journey-time table, transport types and fares |
| 12 | Money & Practical | Currency converter, UPI, bank hours, SIM/eSIM, plugs, dry days |
| 13 | Culture & Etiquette | Dress, temples, photography, Malayalam phrasebook with audio |
| 14 | Safety & SOS | Tap-to-call numbers, beach and monsoon safety, works offline |
| 15 | Responsible Travel | Eco tips, local artisans, approved Ayurveda centres |
| 16 | FAQ & Official Links | Top 25 questions, links to official sources only |

## 4. Navigation
- Desktop top bar: Plan | Explore (Destinations, Experiences, Food, Festivals) | Prepare (Visa, When to go, Getting around, Money, Etiquette) | SOS
- Mobile bottom bar (always visible): Home · Plan · Explore · Calendar · SOS
- Footer: official links, "Last verified" date, disclaimer, language, dark mode

## 5. Page layouts (mobile first)

### Home
+----------------------------------+
| LOGO              [EN v] [moon]  |
+----------------------------------+
|   HERO PHOTO (backwaters)        |
|   "Plan your Keralam trip,       |
|    all in one place"             |
|   [ Start planning -> ]          |
|   Now: PEAK SEASON (Nov-Feb)     |
+----------------------------------+
| Why Kerala: 4 icon tiles         |
| Backwaters|Hills|Beaches|Ayurveda|
+----------------------------------+
| 3 quick steps                    |
| 1 Visa  2 Route  3 Pack          |
+----------------------------------+
| Top 10 for first-timers (cards)  |
+----------------------------------+
| Festivals in next 60 days        |
+----------------------------------+
| Ready itineraries 7 | 10 | 14    |
+----------------------------------+
| IST clock | ₹ converter | SOS    |
+----------------------------------+
| Home  Plan  Explore  Cal  SOS    |  <- bottom bar
+----------------------------------+

### Plan My Trip (wizard)
+----------------------------------+
| Step 2 of 5  ●●○○○               |
+----------------------------------+
| How long is your trip?           |
| [5] [7] [10] [14] [21] days      |
+----------------------------------+
| Live preview:                    |
| Season: Peak ✓                   |
| Festivals: Cochin Carnival       |
| Visa: e-Tourist 30-day           |
+----------------------------------+
| [ Back ]            [ Next -> ]  |
+----------------------------------+

### My Trip (result)
+----------------------------------+
| Your 7-day Keralam trip          |
| 12-18 Dec · Mid-range · 2 people |
| [Print] [Share link] [Edit]      |
+----------------------------------+
| Tabs: Itinerary|Budget|Checklist |
+----------------------------------+
| Day 1 Kochi (Fort Kochi walk)    |
| Day 2 Kochi (Kathakali show)     |
| Day 3 -> Munnar (4 h drive)      |
| ... route map ...                |
+----------------------------------+
| Budget: ₹68,000 ≈ $815 / €750    |
+----------------------------------+

### Destinations
+----------------------------------+
| Search [__________]              |
| Chips: Beaches Backwaters Hills  |
|        Wildlife Falls Heritage   |
| Region: South | Central | North  |
| [List]  [Map]                    |
+----------------------------------+
| [photo] Munnar          Hills    |
| Best: Sep-Mar · 2 days · Idukki  |
| [+ Add to trip]                  |
+----------------------------------+
| [photo] Varkala        Beach     |
+----------------------------------+

### Destination detail
Photo -> quick-facts strip (best time, days needed, nearest airport, distance from Kochi)
-> About -> Things to do -> Getting there -> Where it fits in an itinerary -> Nearby -> [+ Add to trip]

### SOS (offline)
Big tap-to-call buttons: 112 · Ambulance 108 · Tourist helpline 1363 · Fire 101
Beach flags, monsoon alerts, nearest-hospital advice, embassy link.

## 6. Design direction
- Feel: calm, green and fresh, lots of space, photo-led
- Colours: backwater green, monsoon teal, kasavu gold accent, off-white; full dark mode
- Fonts: friendly sans for text, a serif for headings
- Icons: simple line icons; no keralatourism.org photos (own photos or freely licensed ones)
- Accessibility: WCAG AA contrast, alt text, keyboard use, large touch targets

## 7. Features
Must-have (v1): planner wizard, saved trip, destination map + filters, festival calendar,
visa guide, SOS page offline, currency converter, IST clock, dual units, "Last verified" dates, print view.
Later (v2): more languages (DE, FR, ES, AR), phrasebook audio, PDF export, travel-time calculator,
Neelakurinji / Theyyam alerts.

## 8. Tech (recommended)
- Astro static site + content as JSON/Markdown data files (destinations, festivals, food, itineraries)
- Leaflet + OpenStreetMap for maps
- Planner in plain JavaScript; saved trip in localStorage; share via URL
- Offline (PWA) for SOS and My Trip
- Hosting: GitHub Pages or Netlify (free); code on the `claude` branch

Simpler option: plain HTML/CSS/JS, no build step. Fine for v1, harder to grow.

## 9. Data needed before building
- Fixes to the source file (visa 90-day stay rule, e-Visa airports, boat race dates, sanctuary counts)
- Coordinates for every destination
- Price ranges (rooms, houseboats, entry fees, transport, Ayurveda)
- Journey-time table between hubs
- Monthly climate table
- Spice level + veg tag per dish
- Photos with licences

## 10. Build phases (after approval)
1. Data: fix and convert the source file into data files
2. Skeleton: layout, navigation, design system, Home
3. Core content: Before You Go, When to Go, Destinations + map, SOS
4. Planner: wizard, My Trip, budget, sharing
5. Remaining pages: Experiences, Festivals, Food, Itineraries, Practical, Etiquette, FAQ
6. Polish: dark mode, offline, accessibility and mobile testing
7. Review, then push to the `claude` branch

## 11. Decisions needed
1. Site name (working title: "Plan My Keralam")
2. Tech: Astro (recommended) or plain HTML
3. Languages in v1: English only (recommended) or more
4. Hosting: GitHub Pages (recommended) or Netlify
5. Photos: free stock now, your own photos later?
6. Planner depth: rule-based itinerary (recommended, free, no server) or AI-generated (needs an API key and a server)
