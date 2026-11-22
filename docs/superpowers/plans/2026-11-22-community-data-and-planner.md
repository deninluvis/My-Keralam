# Community data, merged planner and site fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four parts of the approved design: quick fixes, a schema-checked community JSON system (PR + browser import) with docs, a merged multi-trip planner with pick-places mode, and traveller-plans and stays pages.

**Architecture:** Content moves to Astro content collections (`src/content/<type>/*.json`, `glob` loader) validated by zod schemas in `src/lib/schemas.js`; the same schemas validate browser imports kept in `localStorage`. Client scripts get collection data from a server-rendered `<script type="application/json">` block, since they can't call `getCollection`. `planner.js` stays pure and gains a manual `stops` input.

**Tech Stack:** Astro 7.4.7, zod via `astro/zod`, Leaflet 1.9.4, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-22-community-data-and-planner-design.md`

## Global Constraints

- All internal links use `url()` from `src/lib/url.js` (base `/My-Keralam`).
- Mobile-first: no horizontal scroll at 375px. Distances show km and mi.
- Never insert HTML from data files or imports; escape all text. Only `https:` URLs; videos only YouTube, embedded via `https://www.youtube-nocookie.com/embed/<id>`.
- No invented real people or real businesses in seed data; one fictional example each, labelled "Example (fictional)".
- Don't copy text from official sites; link to them.
- `npm test` and `npm run build` pass after every task. Commit after every task; never push.
- Disclaimer copy (exact, used in the dialog and footer): "Plan My Keralam is a fun, independent project. Its information is based on public information from the Kerala Tourism website (keralatourism.org). No information or link here has been verified by any authority. Always use official government websites when planning your trip."

## Review Focus

1. An imported file containing `<script>`, `<img onerror>` or a `javascript:` URL: the text shows escaped and the URL is rejected by the schema (test in Task 4 and Task 8).
2. A visitor with an old `localStorage.trip` value: it appears once in My trips after the update and isn't duplicated on reload (test in Task 10).
3. An old shared link `/my-trip?days=7&...`: it opens the same trip on `/plan` (check in Task 11).
4. `localStorage` throws (Safari private mode, quota full): Save/Import shows an error message and the page keeps working (tests in Tasks 7 and 10).
5. A hand-edited `stops=` URL with an unknown id, `0` days or a total over 21: unknown ids are dropped, days are clamped to 1–7 per stop, and the total is clamped to 21 (test in Task 9).

---

## Part 1: quick fixes

### Task 1: Disclaimer dialog and footer

**Files:** Modify `src/layouts/Base.astro`, `src/data/meta.json`, `src/styles/global.css`

- [ ] **Step 1:** Add `"disclaimer"` (exact Global Constraints copy) to `meta.json`.
- [ ] **Step 2:** In `Base.astro`, add a `<dialog id="disclaimer" aria-labelledby="dz-title">` with heading "Before you start", the text (with "keralatourism.org" linked to `https://www.keralatourism.org/`) and a button "I understand". Script: if `sessionStorage.getItem('disclaimerSeen') !== '1'`, call `showModal()`; on close, set it (wrap storage in try/catch; if storage throws, show it each time). Replace the footer's first paragraph with the same text plus the link.
- [ ] **Step 3:** Run `npm run build`. Expected: success. In the browser, a fresh tab shows the dialog, it closes with the button and Esc, it doesn't reappear on the next page, and it fits at 375px.
- [ ] **Step 4:** Commit `feat: disclaimer dialog and footer text`.

### Task 2: Small UI fixes (best months, festival links, hover menus, currency note)

**Files:** Modify `src/pages/destinations/[slug].astro`, `src/pages/festivals.astro`, `src/data/festivals.json`, `src/layouts/Base.astro`, `src/components/CurrencyConverter.astro`, `src/data/meta.json`

- [ ] **Step 1: Best months legend.** Under `.months`, add `<p class="legend small"><span class="m on">■</span> Best time to visit <span class="m">■</span> Less ideal</p>`, and change the `h2` to "Best months to visit".
- [ ] **Step 2: Festival links.** Add an optional `"link"` per festival only where an official page is opened and confirmed in the browser. In the table row header and the card `h3`, wrap the name in `<a href={f.link ?? 'https://www.keralatourism.org/event-calendar/'} rel="noopener">`.
- [ ] **Step 3: Hover menus.** In the `Base.astro` script, when `matchMedia('(hover: hover)').matches`, set `d.open = true` on `mouseenter` of each `.top-nav details` and clear it 150 ms after `mouseleave` (cancel on re-enter). Click, keyboard and touch are unchanged.
- [ ] **Step 4: Currency note.** Add `"ratesUpdated": "2026-11-22"` to `meta.json`. In the converter, replace the `ratesNote` line with: "Fixed rates, last updated {formatted date}. Not live: check your bank or a live rate before paying."
- [ ] **Step 5:** `npm run build`, then check each change in the browser (hovering Plan opens its menu with a mouse).
- [ ] **Step 6:** Commit `fix: best-months legend, festival links, hover menus, currency note`.

### Task 3: Journey times picker

**Files:** Modify `src/pages/getting-around.astro`

**Interfaces:** Consumes `getLeg(a, b, journeys) -> {h, km, mode, estimated}` from `src/lib/planner.js`.

- [ ] **Step 1:** Above the table, add two labelled `<select>`s ("From", "To", options = `bases` sorted by name; defaults Kochi → Munnar) and an `aria-live="polite"` result: "About {h} h · {km} km / {mi} mi · {mode}", with " (estimate)" when `estimated`. When from equals to, show "Choose two different places."
- [ ] **Step 2:** Wrap the existing table in `<details><summary>Show all journey times</summary>…</details>`.
- [ ] **Step 3:** Pass `bases` and `journeys` to the client script with `define:vars` or JSON, and import `getLeg` in a module script.
- [ ] **Step 4:** `npm run build`; in the browser, Kochi → Munnar matches the table row.
- [ ] **Step 5:** Commit `feat: journey time picker with table toggle`.

---

## Part 2: community data system

### Task 4: Shared schemas

**Files:** Create `src/lib/schemas.js`, `tests/schemas.test.js`

**Interfaces — Produces:**
- `TYPES = ['destination','festival','experience','itinerary','stay','traveller-plan']`
- `schemas: Record<type, ZodObject>`: the entry schema per type (without `type`)
- `parseEntry(obj: unknown) -> {ok: true, type, data} | {ok: false, error: string}`: needs `obj.type ∈ TYPES`; `error` names the first failing field path
- `youtubeId(url: string) -> string | null`: accepts `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`

Shared fields: `slug` (`/^[a-z0-9-]+$/`), `name`, `summary`, `lat` (8–13.5), `lng` (74–78), `bestMonths` (ints 1–12, non-empty), `why?` (string; optional because the 35 existing destinations don't have one; docs mark it as recommended), `streetView?` (https URL whose host contains `google.`), `images?` (`{url, credit, license}[]`, https), `videos?` (URLs where `youtubeId` isn't null), `officialLink?` (https), `author?`.
Type-specific fields:
- destination: the existing fields (`categories`, `region` enum south/central/north, `district`, `days`, `airport`, `fromKochi`, `todo[]`, `base?`).
- festival: `months` replaces `bestMonths`, plus `where`, `note`, `link?`. `summary`, `lat` and `lng` are optional for festivals.
- experience: `icon`, `text`, `tips[]`, `link: {href, label}`.
- itinerary: `title`, `who`, `q`, `days: {d, place, what}[]`. `lat`, `lng`, `summary` and `bestMonths` are optional.
- stay: `kind` enum hotel/homestay/rental/houseboat, `area`, `priceRange?`, `website?`.
- traveller-plan: `person {name, knownFor, note, works: string[], links: url[]}`, `tags[]`, `days: {d, place, what}[]`, `stops: string` (stops-query format), `consent`, `fictional?: boolean`.

- [ ] **Step 1: Write failing tests.**
  - `valid destination parses`: a copy of `fort-kochi` with `type:'destination'` → `ok === true`.
  - `rejects http and javascript urls`: `images:[{url:'javascript:alert(1)',…}]` → `ok === false`, and `error` contains `images`.
  - `rejects non-youtube video`: `videos:['https://vimeo.com/1']` → `ok === false`.
  - `rejects month 13` → `ok === false`.
  - `unknown type rejected` → `ok === false`, and `error` contains `type`.
  - `youtubeId` returns `'abc123DEF_-'` for the three URL forms, and `null` for `https://example.com`.
- [ ] **Step 2:** `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `src/lib/schemas.js` with `import { z } from 'astro/zod'`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: shared content schemas`.

### Task 5: Move destinations and festivals into content collections

**Files:** Create `src/content.config.js`, `src/content/destinations/*.json` (35), `src/content/festivals/*.json` (13), `src/lib/content.js`. Delete `src/data/destinations.json` and `src/data/festivals.json`. Modify every importer: `src/pages/index.astro`, `destinations/index.astro`, `destinations/[slug].astro`, `festivals.astro`, `plan.astro`, `my-trip.astro`, `tests/planner.test.js`.

**Interfaces — Produces:**
- Collections `destinations`, `festivals` (later tasks add `experiences`, `itineraries`, `stays`, `travellerPlans`), each `defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/<folder>' }), schema: schemas[<type>] })`.
- `src/lib/content.js`: `async function all(name) -> entry.data[]` (sorted by the `order` field when present, else `name`).
- Client data handoff: `<script type="application/json" id="site-data" set:html={JSON.stringify(obj)}>`, read with `JSON.parse(document.getElementById('site-data').textContent)`.

- [ ] **Step 1:** Write a one-off node script (in the scratchpad, not committed) that writes each array item to `src/content/<folder>/<slug>.json` (festival slug = slugified name; add an `order` field equal to the array index so the current display order is kept).
- [ ] **Step 2:** Add `src/content.config.js` and `src/lib/content.js`, update importers to `await all('destinations')` and the like, and switch client scripts that imported the JSON (`plan.astro`, `my-trip.astro`) to the `site-data` handoff. `tests/planner.test.js` reads the folders with `fs` into arrays (add a `tests/load-content.js` helper).
- [ ] **Step 3:** `npm test && npm run build`. Expected: both pass, still 35 destination pages, and the festivals table is unchanged.
- [ ] **Step 4:** Commit `refactor: destinations and festivals as content collections`.

### Task 6: Move experiences and itineraries into content collections

**Files:** Create `src/content/experiences/*.json` (8), `src/content/itineraries/*.json` (4). Modify `src/content.config.js`, `src/pages/experiences.astro`, `src/pages/itineraries.astro`

- [ ] **Step 1:** Move the inline arrays to files (fields as in the Task 4 schemas, `order` kept), and render from `all('experiences')` / `all('itineraries')`. The markup stays the same.
- [ ] **Step 2:** `npm run build`. Both pages render the same as before.
- [ ] **Step 3:** Commit `refactor: experiences and itineraries as content collections`.

### Task 7: Browser import store, Contribute page and docs

**Files:** Create `src/lib/community.js`, `tests/community.test.js`, `src/pages/contribute.astro`, `docs/CONTRIBUTING-DATA.md`, `docs/examples/{destination,festival,experience,itinerary,stay,traveller-plan}.json`. Modify `Base.astro` (Explore menu + footer link "Contribute")

**Interfaces — Produces** (`storage` defaults to `localStorage`; tests pass a fake):
- `importText(text: string, storage?) -> {added: number, errors: string[]}`: parses JSON (object or array), runs `parseEntry` on each, and stores valid ones under `community:<type>` (replacing any with the same slug). Bad JSON or a throwing storage → an `errors` entry, never an exception.
- `listImported(type, storage?) -> data[]`, each with `imported: true`
- `removeImported(type, slug, storage?) -> void`

- [ ] **Step 1: Failing tests:** an array of 2 valid entries + 1 invalid → `added 2`, `errors.length 1`; re-import of the same slug doesn't duplicate; `removeImported` removes; `'not json'` → an error with no throw; a storage whose `setItem` throws → an error with no throw.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implement. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** `contribute.astro`: the two ways to contribute (GitHub PR: a link to `https://github.com/deninluvis/My-Keralam/new/claude/src/content`; Load file: `<input type="file" accept=".json,application/json">`), the results and errors, the imported list with Delete buttons, the warning "Stored only in this browser on this device.", and a field table per type rendered from the docs examples. `CONTRIBUTING-DATA.md`: the same guide plus rules on image rights, YouTube-only video, and the real-people consent requirement.
- [ ] **Step 6:** `npm run build`; import `docs/examples/destination.json` in the browser, then delete it.
- [ ] **Step 7:** Commit `feat: community import, contribute page and data docs`.

### Task 8: "Imported by you" sections

**Files:** Create `src/lib/render.js`, `tests/render.test.js`. Modify `destinations/index.astro`, `festivals.astro`, `experiences.astro`, `itineraries.astro` (later `stays` and `traveller-plans` pages call it too)

**Interfaces — Produces:** `esc(s) -> string`; `cardHtml(type, entry) -> string`: escaped card markup matching each page's card classes, adding an "Imported by you" tag and the `videos` as nocookie iframes plus `images` with credit when present.

- [ ] **Step 1: Failing tests:** a `name` of `<img src=x onerror=alert(1)>` comes out with no `<img`; a video embed `src` starts with `https://www.youtube-nocookie.com/embed/`.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Each page gets `<section id="imported" hidden><h2>Imported by you</h2><div class="grid three"></div></section>`, filled from `listImported` (shown only when it has entries).
- [ ] **Step 4:** `npm run build`; an imported destination shows on Destinations.
- [ ] **Step 5:** Commit `feat: show imported community entries`.

---

## Part 3: merged planner

### Task 9: Manual stops in the planner

**Files:** Modify `src/lib/planner.js`, `tests/planner.test.js`

**Interfaces — Produces:** `normalise` accepts `stops` (`"munnar:2,alappuzha:1"` or `[{id, days}]`) → `input.stops: {id, days}[] | null`, keeping only ids in `data.bases` (validated in `buildTrip`, since `normalise` has no data) with days clamped 1–7, and `input.days` = the sum clamped to 21. `encodeInput` writes `stops` back. `buildTrip` uses the given stops ordered by base `order` instead of `chooseStops`. A destination slug is resolved to its `base` (or the nearest base by coordinates) by the caller before encoding.

- [ ] **Step 1: Failing tests:** `stops=munnar:2,alappuzha:1` → stop ids `['munnar','alappuzha']` in route order, and `days.length === 3`; `stops=nowhere:2,munnar:0` → one stop `munnar` with 1 day; `stops=kochi:7,munnar:7,thekkady:7,varkala:7` → total days 21; an encode/decode round trip keeps `stops`.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Commit `feat: planner accepts hand-picked stops`.

### Task 10: Saved trips store

**Files:** Create `src/lib/trips.js`, `tests/trips.test.js`

**Interfaces — Produces** (`storage` defaults to `localStorage`):
- `listTrips(storage?) -> {id, name, query, savedAt}[]` (migrates a legacy `trip` key once into an entry named "My trip", then removes `trip`)
- `saveTrip({id?, name, query}, storage?) -> {ok: boolean, trip?, error?}`
- `renameTrip(id, name, storage?)`, `deleteTrip(id, storage?)`

- [ ] **Step 1: Failing tests:** legacy `trip` migrates to exactly one entry across two `listTrips` calls; save, then rename, then delete each round-trip; saving with an existing `id` updates instead of adding; a throwing storage → `{ok:false}`.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Commit `feat: saved trips store`.

### Task 11: One planner page

**Files:** Modify `src/pages/plan.astro` (wizard + result + trips bar), `src/pages/my-trip.astro` (becomes a redirect), `src/layouts/Base.astro` (Plan menu: drop "My Trip"), `public/sw.js` (precache `plan/` only, bump `CACHE` to `keralam-v2`), `src/pages/itineraries.astro` (links to `/plan?…`)

- [ ] **Step 1:** Move the result markup and script from `my-trip.astro` into `plan.astro`. With a query, show the result and hide the wizard ("Edit answers" reopens it); without one, show the wizard. `my-trip.astro` renders a page whose inline script does `location.replace(url('/plan') + location.search)`, with a plain link as fallback.
- [ ] **Step 2:** Trips bar: a list of saved trips (name, dates, Open, Rename, Delete with a confirm), a "New trip" button, and a "Save trip" button on the result with the note "Saved only in this browser on this device. Clearing your browser data deletes it." Errors show inline.
- [ ] **Step 3:** First wizard step: radio "Suggest a route for me" / "I'll choose the places". Choosing places replaces the interests step with a checklist of destinations (collection + `listImported('destination')`, grouped by region), each with a days select (1–7), producing `stops` via the base mapping in Task 9.
- [ ] **Step 4:** `npm test && npm run build`. In the browser: an old `/my-trip?days=7&interests=hills` link redirects and shows the trip; save two trips, reload, delete one; build a hand-picked trip; no horizontal scroll at 375px.
- [ ] **Step 5:** Commit `feat: single planner with saved trips and pick-places mode`.

---

## Part 4: traveller plans and stays

### Task 12: Plans by well-known travellers

**Files:** Create `src/content/traveller-plans/example-fictional.json`, `src/pages/traveller-plans.astro`. Modify `src/content.config.js` (`travellerPlans`), `Base.astro` (Plan menu: "Plans by travellers")

- [ ] **Step 1:** Add one entry with `fictional: true`, `person.name: "Example Traveller (fictional)"` and tags `["ayurveda","culture"]`.
- [ ] **Step 2:** Page: tag filter chips (from the union of tags; `aria-pressed`), cards showing the person (name, known for, note, works, links), the days list, a fictional badge when set, and "Open in planner" → `/plan?stops=…`. Imported plans appear via `cardHtml`.
- [ ] **Step 3:** `npm run build`; filters work and Open in planner builds the trip.
- [ ] **Step 4:** Commit `feat: traveller plans page`.

### Task 13: Stays

**Files:** Create `src/content/stays/example-fictional.json`, `src/pages/stays.astro`. Modify `src/content.config.js` (`stays`), `Base.astro` (Explore menu: "Hotels & stays")

- [ ] **Step 1:** One fictional example (`name: "Example Homestay (fictional)"`).
- [ ] **Step 2:** Page: filter by `kind` and `area`, a Leaflet map of the pins (reusing the destinations map setup), cards with the website link, the note "Listings are added by the community and are not checked or endorsed.", and imported stays via `cardHtml`.
- [ ] **Step 3:** `npm run build`; check filters and the map.
- [ ] **Step 4:** Commit `feat: stays listing`.

### Task 14: Final check

- [ ] `npm test && npm run build` pass.
- [ ] Browser pass at 375px and desktop over every changed page, the dialog, imports and saved trips. Fix anything found and commit.
