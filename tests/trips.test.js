import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listTrips, saveTrip, renameTrip, deleteTrip } from '../src/lib/trips.js';

const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };

test('legacy single trip migrates once', () => {
  const s = memory({ trip: 'days=7&start=2026-12-10' });
  assert.equal(listTrips(s).length, 1);
  const again = listTrips(s);
  assert.equal(again.length, 1);
  assert.equal(again[0].name, 'My trip');
  assert.equal(again[0].query, 'days=7&start=2026-12-10');
  assert.equal(s.getItem('trip'), null);
});

test('save, rename and delete round-trip', () => {
  const s = memory();
  const r = saveTrip({ name: 'Honeymoon', query: 'days=10' }, s);
  assert.equal(r.ok, true);
  assert.ok(r.trip.id);
  renameTrip(r.trip.id, 'Anniversary', s);
  assert.equal(listTrips(s)[0].name, 'Anniversary');
  deleteTrip(r.trip.id, s);
  assert.deepEqual(listTrips(s), []);
});

test('saving with an existing id updates instead of adding', () => {
  const s = memory();
  const { trip } = saveTrip({ name: 'A', query: 'days=7' }, s);
  saveTrip({ id: trip.id, name: 'A', query: 'days=14' }, s);
  const list = listTrips(s);
  assert.equal(list.length, 1);
  assert.equal(list[0].query, 'days=14');
});

test('two saves make two trips, newest first', () => {
  const s = memory();
  saveTrip({ name: 'First', query: 'days=7' }, s);
  saveTrip({ name: 'Second', query: 'days=5' }, s);
  assert.deepEqual(listTrips(s).map((t) => t.name), ['Second', 'First']);
});

test('throwing storage reports failure without throwing', () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} };
  const r = saveTrip({ name: 'A', query: 'days=7' }, broken);
  assert.equal(r.ok, false);
  assert.ok(r.error);
  assert.deepEqual(listTrips(broken), []);
});

test('blank name becomes "My trip"', () => {
  const s = memory();
  assert.equal(saveTrip({ name: '  ', query: 'days=7' }, s).trip.name, 'My trip');
});
