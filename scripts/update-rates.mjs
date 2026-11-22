// Refresh the converter's exchange rates in src/data/meta.json from the European Central Bank
// reference rates (via frankfurter.dev: free, no key). Run by the deploy workflow once a day.
// If anything goes wrong it keeps the existing rates and exits normally, so a deploy never fails on this.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AED_PER_USD = 3.6725; // UAE dirham's fixed peg to the US dollar; the ECB doesn't publish AED.
const round2 = (n) => Math.round(n * 100) / 100;

// API gives foreign units per 1 rupee; the site stores rupees per 1 foreign unit.
export function toInrRates(api, codes) {
  if (!api?.date || !api?.rates) throw new Error('unexpected response');
  const rates = {};
  for (const code of codes) {
    const per = code === 'AED' ? api.rates.USD * AED_PER_USD : api.rates[code];
    if (!(per > 0)) throw new Error(`no rate for ${code}`);
    rates[code] = round2(1 / per);
  }
  return { rates, date: api.date };
}

// Guard against a bad response: no rate may more than double or halve since the last update.
export function plausible(next, old) {
  return Object.entries(next).every(([code, v]) => !old[code] || (v > old[code] / 2 && v < old[code] * 2));
}

async function main() {
  const file = fileURLToPath(new URL('../src/data/meta.json', import.meta.url));
  const meta = JSON.parse(readFileSync(file, 'utf8'));
  const codes = Object.keys(meta.rates);
  const symbols = codes.filter((c) => c !== 'AED').concat('USD');
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=INR&symbols=${[...new Set(symbols)].join(',')}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { rates, date } = toInrRates(await res.json(), codes);
    if (!plausible(rates, meta.rates)) throw new Error(`implausible change: ${JSON.stringify(rates)}`);
    meta.rates = rates;
    meta.ratesUpdated = date;
    writeFileSync(file, JSON.stringify(meta, null, 2) + '\n');
    console.log(`Rates updated (ECB ${date}):`, rates);
  } catch (e) {
    console.warn(`Rates not updated, keeping ${meta.ratesUpdated}: ${e.message}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
