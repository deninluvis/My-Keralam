// Rule-based trip planner. Pure functions: same input + data always gives the same trip.
// Used by the browser (Plan My Trip / My Trip pages) and by tests/planner.test.js.

export const INTERESTS = ['backwaters', 'beaches', 'hills', 'wildlife', 'culture', 'ayurveda', 'food', 'adventure'];
export const BUDGETS = ['budget', 'mid', 'luxury'];
export const PACES = ['relaxed', 'balanced', 'fast'];

const PACE_DAYS = { relaxed: 3, balanced: 2.3, fast: 1.7 };
const POPULAR = { munnar: 1.5, alappuzha: 1.5, thekkady: 1, varkala: 1, kochi: 0 };
const THEYYAM_MONTHS = [11, 12, 1, 2, 3, 4, 5];

// Rough costs in INR. Labelled as estimates on the site.
const COST = {
  perPersonDay: { budget: 3000, mid: 8000, luxury: 22000 },
  houseboatPerBoat: { budget: 9000, mid: 15000, luxury: 35000 },
  ayurvedaPerPersonDay: { budget: 2500, mid: 6000, luxury: 15000 },
  carPerKm: { budget: 0, mid: 18, luxury: 28 },
  carMin: { budget: 0, mid: 2500, luxury: 4000 },
  busTrainPerPersonLeg: 400,
  seasonFactor: { peak: 1.15, summer: 0.95, monsoon: 0.8, shoulder: 0.9 },
};

const clampInt = (v, lo, hi, dflt) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function haversineKm(a, b) {
  const r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function getLeg(a, b, journeys) {
  const key = [a.id, b.id].sort().join('|');
  const known = journeys.legs[key];
  if (known) return { ...known, estimated: false };
  const km = Math.round(haversineKm(a, b) * 1.4);
  return { km, h: Math.max(1, Math.round((km / 38) * 2) / 2), mode: 'Road (estimated)', estimated: true };
}

function scoreBase(b, input, month, days) {
  const interests = input.interests;
  let s = 1 + 3 * b.tags.filter((t) => interests.includes(t)).length + (POPULAR[b.id] || 0);
  const season = monthSeason(month);
  if (season === 'monsoon' && b.tags[0] === 'beaches') s -= 2;
  if (season === 'monsoon' && b.tags.includes('ayurveda')) s += 1;
  if (b.theyyam) s += THEYYAM_MONTHS.includes(month) && interests.includes('culture') ? 3 : -2;
  if (b.houseboat && interests.includes('backwaters')) s += 1;
  if (b.region === 'north') s -= days < 10 ? 100 : days < 14 ? 2 : 0;
  return s;
}

let MONTHS_CACHE = null;
function monthSeason(m) {
  return MONTHS_CACHE ? MONTHS_CACHE.find((x) => x.m === m).season : 'peak';
}

function chooseStops(input, data, month) {
  const { days, pace } = input;
  const scored = data.bases
    .map((b) => ({ ...b, score: scoreBase(b, input, month, days) }))
    .sort((a, b) => b.score - a.score || a.order - b.order);

  const target = Math.min(9, Math.max(1, Math.round(days / PACE_DAYS[pace])));
  const kochi = scored.find((b) => b.id === 'kochi');
  let picked = [kochi, ...scored.filter((b) => b.id !== 'kochi' && b.score > 0).slice(0, target - 1)];

  // Drop the lowest-scoring stops until the minimum days fit.
  const minSum = () => picked.reduce((s, b) => s + b.minDays, 0);
  while (minSum() > days && picked.length > 1) {
    const worst = picked.filter((b) => b.id !== 'kochi').sort((a, b) => a.score - b.score)[0];
    picked = picked.filter((b) => b !== worst);
  }

  picked.sort((a, b) => a.order - b.order);
  picked.forEach((b) => (b.days = Math.min(b.minDays, days)));

  // Hand out the remaining days to the best-scoring stops, Ayurveda stops first if asked.
  let left = days - picked.reduce((s, b) => s + b.days, 0);
  const prefer = [...picked].sort((a, b) => {
    const ay = (x) => (input.interests.includes('ayurveda') && x.tags.includes('ayurveda') ? 10 : 0);
    return ay(b) + b.score - (ay(a) + a.score);
  });
  while (left > 0) {
    const open = prefer.find((b) => b.days < b.maxDays);
    const target2 = open || prefer[0]; // everything full: extra relaxed days at the favourite stop
    target2.days += 1;
    left -= 1;
    if (!open) prefer.push(prefer.shift());
  }
  return picked;
}

function buildDays(stops, input, data) {
  const out = [];
  let n = 1;
  const airports = data.journeys.airports;
  const first = stops[0], last = stops[stops.length - 1];
  stops.forEach((stop, si) => {
    for (let i = 0; i < stop.days; i++) {
      const lines = [];
      let travel = null;
      if (si === 0 && i === 0) {
        const ap = airports[first.airport];
        if (ap.toBase === first.id) {
          lines.push(`Arrive at ${ap.name}, ${ap.transfer}.`);
        } else {
          const hub = data.bases.find((b) => b.id === ap.toBase);
          const leg = getLeg(hub, first, data.journeys);
          lines.push(`Arrive at ${ap.name}, then about ${leg.h} h by road to ${first.name}.`);
        }
      } else if (i === 0) {
        const prev = stops[si - 1];
        travel = { from: prev.name, to: stop.name, ...getLeg(prev, stop, data.journeys) };
        lines.push(`Travel ${prev.name} → ${stop.name}: about ${travel.h} h (${travel.km} km, ${Math.round(travel.km * 0.621)} mi). ${travel.mode}.`);
      }
      lines.push(stop.plans[i] || 'Free day: slow down, revisit a favourite spot or book a treatment or class.');
      if (si === stops.length - 1 && i === stop.days - 1) {
        lines.push(`Transfer to ${airports[last.airport].name} for your flight home.`);
      }
      out.push({ n, date: addDays(input.start, n - 1), base: stop.name, baseId: stop.id, lines, travel });
      n += 1;
    }
  });
  return out;
}

function buildBudget(stops, input, data, seasonId) {
  const { budget: tier, people, days } = input;
  const f = COST.seasonFactor[seasonId] || 1;
  let daily = COST.perPersonDay[tier] * people * days * f;
  let houseboat = 0, ayurveda = 0, transport = 0;

  if (stops.some((s) => s.houseboat) && input.interests.includes('backwaters')) {
    houseboat = COST.houseboatPerBoat[tier] * Math.ceil(people / 2) * f;
    daily -= COST.perPersonDay[tier] * 0.5 * people * f; // houseboat replaces one night's room
  }
  if (input.interests.includes('ayurveda')) {
    const ayDays = Math.min(3, stops.filter((s) => s.tags.includes('ayurveda')).reduce((s, x) => s + x.days, 0));
    ayurveda = COST.ayurvedaPerPersonDay[tier] * ayDays * people;
  }
  for (let i = 1; i < stops.length; i++) {
    const leg = getLeg(stops[i - 1], stops[i], data.journeys);
    transport += tier === 'budget'
      ? COST.busTrainPerPersonLeg * people
      : Math.max(COST.carMin[tier], leg.km * COST.carPerKm[tier]) * Math.ceil(people / 4);
  }
  const total = daily + houseboat + ayurveda + transport;
  const r = (x) => Math.round(x / 500) * 500;
  return {
    low: r(total * 0.85), high: r(total * 1.2),
    parts: { daily: r(daily), houseboat: r(houseboat), ayurveda: r(ayurveda), transport: r(transport) },
    excludes: 'International flights, visa fees, insurance and shopping.',
  };
}

function buildVisa(input, visa) {
  const nat = visa.nationalities.find((x) => x.id === input.nat) || visa.nationalities.find((x) => x.id === 'OTHER');
  if (nat.notEligible) {
    return { eligible: false, nat, notes: ['You are not eligible for the e-Visa. Apply for a regular visa through the Indian mission in your country.'] };
  }
  const recommended = visa.types.find((t) => t.id === (input.days <= 30 ? '30d' : '1y'));
  const notes = [
    `Apply only on the official portal (${visa.portal}). Other sites charge extra.`,
    'Apply at least 4 days before you fly.',
    'Fill in the free e-Arrival Card online before you land.',
  ];
  if (input.days > 30) notes.push('Your trip is longer than 30 days, so the 30-day e-Visa is not enough.');
  if (nat.longStay && input.days > nat.longStay) {
    notes.push(`Each stay on a 1-year or 5-year e-Visa is limited to ${nat.longStay} days for your nationality.`);
  }
  if (nat.unknown) notes.push('Fees and stay limits vary by nationality. Check the official fee table.');
  return { eligible: true, nat, recommended, voa: !!nat.voa, voaNote: nat.voaNote || null, notes };
}

function buildPacking(stops, seasonId, input) {
  const list = ['Passport (valid 6+ months) and printed e-Visa', 'Travel insurance documents', 'Light cotton clothes', 'Modest outfit covering shoulders and knees for temples', 'Sunscreen, hat and sunglasses', 'Insect repellent', 'Reusable water bottle', 'Universal plug adapter (Types C, D, M; 230 V)', 'Cash in small notes for autos and snacks'];
  if (seasonId === 'monsoon' || seasonId === 'shoulder') list.push('Rain jacket or umbrella', 'Quick-dry clothes and sandals');
  if (stops.some((s) => s.tags.includes('hills'))) list.push('Warm layer for cool hill nights');
  if (input.interests.includes('wildlife') || input.interests.includes('adventure')) list.push('Closed walking shoes and leech socks (forest treks)');
  if (input.interests.includes('ayurveda')) list.push('Old clothes you do not mind getting oily');
  return list;
}

export function buildTrip(rawInput, data) {
  MONTHS_CACHE = data.months;
  const input = normalise(rawInput);
  const month = Number(input.start.slice(5, 7));
  const seasonId = monthSeason(month);
  const picked = pickedStops(input, data);
  if (picked) input.days = picked.reduce((s, b) => s + b.days, 0);
  else delete input.stops;
  const stops = picked || chooseStops(input, data, month);
  const days = buildDays(stops, input, data);
  const end = days[days.length - 1].date;

  const tripMonths = new Set();
  for (let i = 0; i < input.days; i++) tripMonths.add(Number(addDays(input.start, i).slice(5, 7)));
  const festivals = data.festivals.filter((f) => f.months.some((m) => tripMonths.has(m)));

  const warnings = [];
  if (seasonId === 'monsoon') warnings.push('Your dates fall in the monsoon: heavy rain, rough seas (no swimming) and possible landslide alerts in the hills. Keep plans flexible.');
  if (seasonId === 'peak') warnings.push('Peak season: book rooms, houseboats and park visits well ahead.');
  if (input.interests.includes('culture') && stops.some((s) => s.theyyam) && THEYYAM_MONTHS.includes(month)) {
    warnings.push('Theyyam dates change every year. Check the official Theyyam calendar before fixing your Kannur days.');
  }

  return {
    input, end, stops: stops.map(({ id, name, region, order, days: d, tags, houseboat, theyyam, lat, lng, airport }) => ({ id, name, region, order, days: d, tags, houseboat: !!houseboat, theyyam: !!theyyam, lat, lng, airport })),
    days, season: { id: seasonId, ...data.seasons[seasonId] }, month: data.months.find((m) => m.m === month),
    festivals, warnings, visa: buildVisa(input, data.visa), budget: buildBudget(stops, input, data, seasonId),
    packing: buildPacking(stops, seasonId, input),
  };
}

// Hand-picked stops: known bases only, in route order, total capped at 21 days (later stops trimmed). Null if none.
function pickedStops(input, data) {
  if (!input.stops) return null;
  const seen = new Set();
  const chosen = input.stops
    .map((s) => ({ s, b: data.bases.find((x) => x.id === s.id) }))
    .filter(({ b }) => b && !seen.has(b.id) && seen.add(b.id))
    .sort((x, y) => x.b.order - y.b.order);
  let left = 21;
  const out = [];
  for (const { s, b } of chosen) {
    const d = Math.min(s.days, left);
    if (d > 0) out.push({ ...b, days: d });
    left -= d;
  }
  return out.length ? out : null;
}

function parseStops(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(',').filter(Boolean).map((p) => { const [id, d] = p.split(':'); return { id, days: d }; });
  const out = list.filter((s) => /^[a-z0-9-]+$/.test(s?.id || '')).map((s) => ({ id: s.id, days: clampInt(s.days, 1, 7, 1) }));
  return out.length ? out : null;
}

export function normalise(raw = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(raw.start || '') && !Number.isNaN(Date.parse(raw.start)) ? raw.start : today;
  let interests = Array.isArray(raw.interests) ? raw.interests : String(raw.interests || '').split(',');
  interests = INTERESTS.filter((i) => interests.includes(i));
  const stops = parseStops(raw.stops);
  return {
    start,
    days: clampInt(raw.days, 3, 21, 7),
    interests,
    budget: BUDGETS.includes(raw.budget) ? raw.budget : 'mid',
    pace: PACES.includes(raw.pace) ? raw.pace : 'balanced',
    people: clampInt(raw.people, 1, 12, 2),
    nat: /^[A-Z]{2,5}$/.test(raw.nat || '') ? raw.nat : 'OTHER',
    ...(stops && { stops }),
  };
}

export function encodeInput(input) {
  const p = new URLSearchParams();
  const { stops, ...n } = normalise(input);
  for (const [k, v] of Object.entries(n)) p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  if (stops) p.set('stops', stops.map((s) => `${s.id}:${s.days}`).join(','));
  return p.toString();
}

export function decodeInput(query) {
  const p = new URLSearchParams(query);
  return normalise(Object.fromEntries(p.entries()));
}
