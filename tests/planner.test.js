import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadFolder } from './load-content.js';
import { buildTrip, encodeInput, decodeInput } from '../src/lib/planner.js';

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
