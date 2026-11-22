# Community data, merged planner and site fixes: design

Date: 2026-11-22 · Status: draft for approval

## Intent

Plan My Keralam is a fun, independent project. The owner wants to:
- make it honest about where its information comes from (disclaimers);
- fix confusing or broken bits (best-months chips, header hover, journey times, currency converter);
- let the community grow the site with simple `.json` files, both for everyone (via GitHub) and privately (loaded in their own browser);
- turn Plan My Trip and My Trip into one planner that saves several trips in the browser and lets people pick places by hand;
- add plans from well-known travellers and a stays (hotels/rentals) listing.

## Goals / non-goals / anti-goals

Goals: every item in the owner's list, shipped in four parts, in this order:
1. quick fixes, 2. data system and docs, 3. merged planner, 4. famous-traveller plans and stays.

Non-goals: no server, accounts, database, moderation queue or bookings. No live exchange-rate API.

Anti-goals (would count as failure even if it works):
- The site looks official or claims its facts are verified.
- Invented quotes, plans or endorsements attributed to real, named people.
- A bad community file breaks the live site, or an imported file can run script in the page.
- Saved trips get silently lost when this ships (the existing `trip` key must migrate).

## Constraints (from the repo)

- Static Astro 7 site on GitHub Pages under `/My-Keralam`; all internal links use `url()`.
- Mobile-first, no horizontal scroll at 375px, metric + imperial units.
- Don't copy text or photos from official sites; link to them.
- `npm test` and `npm run build` must pass. `src/lib/planner.js` stays pure and tested.

## Approaches considered (data system)

1. **One file per entry, schema-checked at build and in the browser.** Chosen.
   Contributors add files, never edit shared ones, so PRs don't conflict; one schema serves the build and the browser import.
2. One big JSON file per type (today's shape). Smallest change now, but every PR edits the same file and the browser import would need separate code.
3. Load all content at runtime in the browser. One code path, but pages are empty until JS runs; worse for SEO and the offline SOS page.

## Part 1: quick fixes

- **Disclaimer pop-up.** Native `<dialog>` in `Base.astro`, shown once per browser session (`sessionStorage`), closed by an "I understand" button or Esc. Text: this is a fun, independent project; information is based on public information from keralatourism.org (linked); nothing here, including links, has been verified by any authority; always use official government websites when planning. The same text replaces the footer blurb. *My call:* once per session, not on every page click, which would make the site unusable; and "based on public information from" rather than "collected from", because the repo rules forbid copying their text.
- **Best months.** Add a legend under the chips ("■ Best time to visit ■ Less ideal") and a short sentence. Same legend wherever month chips appear.
- **Festival links.** Each festival gets an optional `link`. The festival name in the year table and on the cards becomes a link to it, falling back to the official event calendar when there's no specific link. *My call:* only add specific links I can open and confirm; the rest use the fallback.
- **Header hover.** On devices with a mouse (`@media (hover: hover)`), hovering a menu opens it (small JS: `mouseenter` sets `open`, `mouseleave` with a short delay clears it). Click and keyboard keep working; touch is unchanged.
- **Journey times.** "From" and "To" selects (all bases) show time, distance in km/mi and mode, using `getLeg` (estimated legs marked "estimate"). The full table stays available behind a "Show all journey times" toggle.
- **Currency converter.** Not live. Add a visible line: "Fixed rates, last updated <date>. Not live: check your bank or a live rate before paying." Add `ratesUpdated` to `meta.json`.

## Part 2: community data system

### Files and types

Content moves to `src/content/<type>/<slug>.json`, one entry per file, loaded with Astro content collections (`glob` loader) and validated at build. Types:

| Type | Folder | Notes |
|---|---|---|
| Destinations | `destinations/` | migrated from `src/data/destinations.json` |
| Festivals & events | `festivals/` | migrated from `festivals.json`, adds `link` |
| Experiences | `experiences/` | moved out of `experiences.astro` |
| Itineraries | `itineraries/` | moved out of `itineraries.astro` |
| Stays | `stays/` | new (Part 4) |
| Traveller plans | `traveller-plans/` | new (Part 4) |

`bases.json`, `journeys.json` and the other reference data stay as they are: they drive the planner's routing and aren't community content.

### Shared fields (destinations, festivals, experiences, stays)

Required: `name`, `summary`, `lat`, `lng`, `bestMonths` (1–12, may be all 12), `why` (why visit, a few sentences).
Optional: `streetView` (Google Maps URL), `images` (list of `{url, credit, license}`, https only, the contributor must have rights), `videos` (YouTube URLs only), `officialLink`, `author` (contributor name/GitHub handle).
Plus type-specific fields (e.g. destination `categories`, `region`, `base`; festival `months`, `where`; stay `kind` hotel/homestay/rental/houseboat, `priceRange`, `website`).

### One schema, two uses

Schemas live in `src/lib/schemas.js` (zod via `astro/zod`). `src/content.config.js` uses them for the build; the browser import bundles the same file. A broken PR file fails the build with a clear message. Rules beyond shape: URLs must be `https:`; video URLs must be YouTube (rendered as `youtube-nocookie.com` embeds by video ID); slugs unique.

### Browser import (private)

New page **Contribute** (`/contribute`, linked from the footer and Explore menu):
- "Load JSON file" accepts a single entry or an array; each entry has a `type` field. Valid entries are saved in `localStorage` under `community:<type>`; invalid ones show which field failed.
- A list of what you've imported, with delete buttons, and a warning that it's stored only in this browser.
- List pages (destinations, festivals, experiences, itineraries, stays, traveller plans) render imported entries client-side in an "Imported by you" section, using the same card markup. All text is escaped; no HTML from files is ever inserted.
- The planner can use imported destinations (Part 3).

### Documentation

- `docs/CONTRIBUTING-DATA.md` in the repo: how to add a file by PR, how to load one privately, a field table per type, rules on images/rights and on real people, and links to example files in `docs/examples/`.
- The `/contribute` page carries the same guide on the live site and links to the repo doc and the GitHub "Add file" page.

## Part 3: merged planner

- `/plan` becomes the single planner page: a **My trips** bar at the top (saved trips, open / delete / new), the question wizard, and the result (today's My Trip view) on the same page. `/my-trip` redirects to `/plan`, keeping the query string, so old shared links still work. The service worker precache list is updated.
- **Saving:** a "Save trip" button with an inline note: "Saved only in this browser on this device. Clearing your browser data deletes it." Trips are stored as `localStorage.trips = [{id, name, query, savedAt}]`; you can rename and delete them. The old single `trip` key is migrated into the list once.
- **Pick places myself:** the first step asks "Suggest a route for me" or "I'll choose the places". Choosing places shows destinations (including imported ones) as checkboxes with a days-per-place picker. The planner orders them along the route (north–south `order`, via each destination's `base`; imported destinations without a `base` use the nearest base by coordinates), then builds days, travel legs, budget, visa and packing as usual. Encoded in the URL as `stops=munnar:2,alappuzha:1`.
- `planner.js` gets a `stops` input path that skips `chooseStops`; `tests/planner.test.js` gains tests for it and for URL encode/decode.

## Part 4: traveller plans and stays

- **Plans by well-known travellers:** a new Plan menu page with filter chips by tag (Ayurveda, culture, trekking, food, wildlife, backwaters…). Each plan shows the person's name, why they're known, a short note from them, their work and links, the day-by-day plan, and "Open in planner" (uses the pick-places mode). Required fields: `person {name, knownFor, note, works[], links[]}`, `tags[]`, `days[]`, `consent` (a short statement or a link showing the person agreed). It ships with **one clearly labelled fictional example**; no real people until real, consented entries arrive.
- **Stays:** a new Explore page listing hotels, homestays, rentals and houseboats from `stays/` files, filterable by kind and area, each showing a map pin and website link, with a note: "Listings are added by the community and are not checked or endorsed." It ships with the folder, schema, docs and one example only. *My call:* no real businesses invented as seed data.

## Left to the builder

Exact copy wording, visual styling within existing tokens, slug naming, the migration script (run once, not kept), and how cards are shared between the server render and the "Imported by you" client render (one small render helper is fine).
