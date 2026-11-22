# Plan My Keralam

An independent, mobile-first website that helps foreign visitors plan a trip to Kerala (Keralam), India, all in one place.

## What's in it
- **Plan My Trip**: a 5-step planner that builds a day-by-day itinerary with travel times, a budget estimate (₹ plus your currency), visa advice for your nationality, festivals on your dates and a packing list. Rule-based, runs entirely in the browser, saved in `localStorage`, shareable by link.
- **16 sections**: destinations (filters + map, 36 places), experiences, festivals calendar, food guide, itineraries, visa guide, when to go, getting around, money, etiquette and phrasebook, safety & SOS (works offline), responsible travel, FAQ and official links.
- Dark mode, print view, °C/°F and km/mi, accessible markup.

## Run it locally
```bash
npm install
npm run dev
```
Then open http://localhost:4321/My-Keralam/

## Other commands
| Command | What it does |
|---|---|
| `npm test` | Runs the planner tests |
| `npm run build` | Builds the static site into `dist/` |
| `npm run preview` | Serves the built site |

## Editing content
All content lives in `src/data/*.json`: destinations, festivals, food, visa rules, monthly climate, journey times, emergency numbers and exchange rates. Update `src/data/meta.json` → `lastVerified` whenever you re-check facts.

## Deploying
`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to the `claude` branch. One-time setup: in the GitHub repo go to **Settings → Pages → Source** and choose **GitHub Actions**.

## Before launch
Re-check visa rules, fees, festival dates and prices against the official sources linked on the FAQ page. Photos are placeholders: add your own or freely licensed photos with credits.
