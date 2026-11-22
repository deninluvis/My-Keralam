# Soul of Keralam

A static Astro website that helps foreign visitors plan a trip to Kerala (Keralam), India.

## Run it locally
- Requires **Node.js 22.23.4 or newer** (`node -v`).
- First time: `npm install`
- Start: `npm run dev`, then open **http://localhost:4321/soul-of-keralam-Your-insider-pass-to-Kerala/** (the `/soul-of-keralam-Your-insider-pass-to-Kerala/` part is required).
- Or ask Claude: "run the site" (uses `.claude/skills/run-site`).

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with live reload on port 4321 |
| `npm test` | Planner unit tests (`tests/planner.test.js`) |
| `npm run build` | Build static site into `dist/` |
| `npm run preview` | Serve the built `dist/` |

## Project layout
- `src/data/*.json`: all content (destinations, festivals, food, visa rules, climate, journey times, emergency numbers, exchange rates). Update `meta.json` → `lastVerified` after re-checking facts.
- `src/lib/planner.js`: rule-based trip planner (pure functions, shared by browser and tests).
- `src/lib/url.js`: `url()` helper. Always use it for internal links so the `/soul-of-keralam-Your-insider-pass-to-Kerala` base path works.
- `src/pages/`: one `.astro` file per page; `src/layouts/Base.astro` holds header, bottom bar and footer.
- `src/styles/global.css`: design tokens (light + dark) and shared styles.
- `public/sw.js`: offline cache for the SOS and My Trip pages.
- `docs/website-plan.md`: the approved plan.

## Rules
- Push only to the `claude` branch. Pushing to it deploys to GitHub Pages (`.github/workflows/deploy.yml`).
- Run `npm test` and `npm run build` before committing.
- Keep pages mobile-first (no horizontal scroll at 375px) and show both metric and imperial units.
- Visa, fee and festival facts are time-sensitive: link to official sources, don't copy their text or photos.
- The site is independent: never present it as an official Government of Kerala site.
