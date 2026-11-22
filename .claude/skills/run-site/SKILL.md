---
name: run-site
description: Start the Soul of Keralam website locally (Astro dev server) and give the user the URL. Use when the user asks to run, start, launch, open or preview the site or app locally.
---

# Run the Soul of Keralam site locally

Follow these steps in order from the repository root.

1. **Check Node.js.** Run `node -v`. Astro needs **22.23.4 or newer**. If Node is missing or older, stop and tell the user to install the LTS version from https://nodejs.org, then reopen the terminal.

2. **Install packages if needed.** If the `node_modules` folder is missing, or `package.json` / `package-lock.json` is newer than it, run `npm install`.

3. **Check that nothing is already running on port 4321.** If the site is already being served at http://localhost:4321/soul-of-keralam-Your-insider-pass-to-Kerala/, don't start a second copy; just give the user the link.

4. **Start the dev server in the background:** `npm run dev`. Run it as a background command so the session stays usable.

5. **Wait until it is ready.** Poll `http://localhost:4321/soul-of-keralam-Your-insider-pass-to-Kerala/` (for example with `curl -s -o /dev/null -w "%{http_code}"`) until it returns 200, for up to about 30 seconds. If it fails, read the server output and fix or report the error.

6. **Tell the user:**
   - Open **http://localhost:4321/soul-of-keralam-Your-insider-pass-to-Kerala/** (the `/soul-of-keralam-Your-insider-pass-to-Kerala/` path is required; `/` alone gives 404).
   - Edits to files in `src/` reload the browser automatically.
   - To stop the server, ask Claude to stop it, or press Ctrl + C in the terminal running it.

## Optional checks (only if the user asks to test)
- `npm test` runs the planner tests.
- `npm run build` then `npm run preview` serves the production build at the same URL.

## Common problems
- **Port 4321 in use:** another dev server is running. Stop it, or run `npm run dev -- --port 4322` and use port 4322 in the URL.
- **"Unsupported engine" / syntax errors on install:** Node is too old; upgrade it.
- **Blank maps:** map tiles load from OpenStreetMap and need internet access.
