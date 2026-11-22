import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadFolder } from './load-content.js';
import { buildTrip, encodeInput, decodeInput, mapsLink } from '../src/lib/planner.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}.json`, import.meta.url)));
const data = {
  bases: load('bases'), journeys: load('journeys'), months: load('months'),
  festivals: loadFolder('festivals'), visa: load('visa'), seasons: load('seasons'),
};

const base = { start: '2026-12-10', days: 7, interests: ['backwaters', 'hills'], budget: 'mid', pace: 'balanced', people: 2, nat: 'US' };

test('itinerary has exactly one entry per trip day, with consecutive dates', () => {
  for (const days of [3, 5, 7, 10, 14, 21]) {
    const trip = buildTrip({ ...base, days }, data);
    assert.equal(trip.days.length, days, `days=${days}`);
    assert.equal(trip.days[0].date, '2026-12-10');
    trip.days.forEach((d, i) => assert.equal(d.n, i + 1));
  }
});

test('stop days add up to trip length and respect each stop maximum when possible', () => {
  const trip = buildTrip({ ...base, days: 10 }, data);
  const sum = trip.stops.reduce((s, x) => s + x.days, 0);
  assert.equal(sum, 10);
});

test('always includes Kochi and orders stops north to south', () => {
  const trip = buildTrip({ ...base, days: 14, interests: ['culture', 'wildlife', 'hills'] }, data);
  assert.ok(trip.stops.some((s) => s.id === 'kochi'));
  const orders = trip.stops.map((s) => s.order);
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b));
});

test('backwaters interest includes a houseboat stop', () => {
  const trip = buildTrip(base, data);
  assert.ok(trip.stops.some((s) => s.id === 'alappuzha' || s.id === 'kumarakom'));
});

test('short trips stay in central and south Kerala', () => {
  const trip = buildTrip({ ...base, days: 5, interests: ['culture'] }, data);
  assert.ok(trip.stops.every((s) => s.region !== 'north'));
});

test('monsoon trips flag the season and avoid beach-only picks', () => {
  const trip = buildTrip({ ...base, start: '2026-07-05', interests: ['ayurveda'] }, data);
  assert.equal(trip.season.id, 'monsoon');
  assert.ok(trip.warnings.some((w) => /monsoon/i.test(w)));
});

test('visa: trips up to 30 days get the 30-day e-Visa; Pakistan is not eligible', () => {
  const de = buildTrip({ ...base, days: 21, nat: 'DE' }, data);
  assert.equal(de.visa.recommended.id, '30d');
  const long = buildTrip({ ...base, days: 21, nat: 'PK' }, data);
  assert.equal(long.visa.eligible, false);
});

test('visa: Japan gets visa-on-arrival note', () => {
  const trip = buildTrip({ ...base, nat: 'JP' }, data);
  assert.ok(trip.visa.voa);
});

test('budget is a positive range with low < high, and scales with people', () => {
  const one = buildTrip({ ...base, people: 1 }, data).budget;
  const four = buildTrip({ ...base, people: 4 }, data).budget;
  assert.ok(one.low > 0 && one.low < one.high);
  assert.ok(four.low > one.low * 2);
});

test('arrival line names the first stop when the airport is elsewhere', () => {
  const trip = buildTrip({ ...base, start: '2027-01-10', days: 14, interests: ['culture', 'beaches', 'food'] }, data);
  const first = trip.stops[0];
  if (first.id !== 'kochi') assert.match(trip.days[0].lines[0], new RegExp(first.name));
});

test('festivals during the trip are listed', () => {
  const trip = buildTrip({ ...base, start: '2026-12-20', days: 14 }, data);
  const names = trip.festivals.map((f) => f.name);
  assert.ok(names.includes('Cochin Carnival'));
});

test('encode/decode round-trips the planner input', () => {
  const back = decodeInput(encodeInput(base));
  assert.deepEqual(back, base);
});

test('decode rejects junk safely', () => {
  const back = decodeInput('days=abc&people=-4&budget=gold&interests=<script>');
  assert.ok(back.days >= 3 && back.days <= 21);
  assert.ok(back.people >= 1);
  assert.equal(back.budget, 'mid');
  assert.deepEqual(back.interests, []);
});

test('hand-picked stops are used in route order', () => {
  const trip = buildTrip({ ...base, stops: 'munnar:2,alappuzha:1,kochi:1' }, data);
  assert.deepEqual(trip.stops.map((s) => s.id), ['kochi', 'munnar', 'alappuzha']);
  assert.deepEqual(trip.stops.map((s) => s.days), [1, 2, 1]);
  assert.equal(trip.days.length, 4);
  assert.equal(trip.input.days, 4);
});

test('hand-picked stops drop unknown ids and clamp days to 1-7', () => {
  const trip = buildTrip({ ...base, stops: 'nowhere:2,munnar:0,thekkady:99' }, data);
  assert.deepEqual(trip.stops.map((s) => [s.id, s.days]), [['munnar', 1], ['thekkady', 7]]);
  assert.equal(trip.days.length, 8);
});

test('hand-picked stops total is capped at 21 days', () => {
  const trip = buildTrip({ ...base, stops: 'kochi:7,munnar:7,thekkady:7,varkala:7' }, data);
  assert.equal(trip.days.length, 21);
  assert.equal(trip.stops.reduce((s, x) => s + x.days, 0), 21);
});

test('no valid stops falls back to a suggested route', () => {
  const trip = buildTrip({ ...base, stops: 'nowhere:3' }, data);
  assert.equal(trip.input.stops, undefined);
  assert.equal(trip.days.length, 7);
});

test('stops survive encode and decode', () => {
  const q = encodeInput({ ...base, stops: 'munnar:2,kochi:1' });
  assert.deepEqual(decodeInput(q).stops, [{ id: 'munnar', days: 2 }, { id: 'kochi', days: 1 }]);
  assert.equal(new URLSearchParams(encodeInput(base)).has('stops'), false);
});

test('mapsLink gives a Google Maps driving route through every stop in order', () => {
  const trip = buildTrip({ ...base, stops: 'kochi:1,munnar:2,alappuzha:1' }, data);
  const u = new URL(mapsLink(trip.stops));
  assert.equal(u.origin + u.pathname, 'https://www.google.com/maps/dir/');
  assert.equal(u.searchParams.get('api'), '1');
  assert.equal(u.searchParams.get('travelmode'), 'driving');
  assert.equal(u.searchParams.get('origin'), 'Kochi, Kerala, India');
  assert.equal(u.searchParams.get('waypoints'), 'Munnar, Kerala, India');
  assert.equal(u.searchParams.get('destination'), 'Alappuzha, Kerala, India');
});

test('mapsLink with one stop just points at it', () => {
  const u = new URL(mapsLink([{ name: 'Munnar', lat: 10.1, lng: 77.06 }]));
  assert.equal(u.searchParams.get('destination'), 'Munnar, Kerala, India');
  assert.equal(u.searchParams.has('waypoints'), false);
});
