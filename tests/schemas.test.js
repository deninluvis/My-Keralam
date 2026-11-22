import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFolder } from './load-content.js';
import { parseEntry, youtubeId, TYPES } from '../src/lib/schemas.js';

const fortKochi = loadFolder('destinations')[0];
const dest = (extra = {}) => ({ type: 'destination', ...fortKochi, ...extra });

test('TYPES lists every community type', () => {
  assert.deepEqual(TYPES, ['destination', 'festival', 'experience', 'itinerary', 'stay', 'traveller-plan']);
});

test('valid destination parses', () => {
  const r = parseEntry(dest({ why: 'History.', videos: ['https://youtu.be/abc123DEF_-'] }));
  assert.equal(r.ok, true);
  assert.equal(r.type, 'destination');
  assert.equal(r.data.name, fortKochi.name);
});

test('rejects javascript and http image urls', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com/a.jpg']) {
    const r = parseEntry(dest({ images: [{ url, credit: 'me', license: 'CC0' }] }));
    assert.equal(r.ok, false, url);
    assert.match(r.error, /images/);
  }
});

test('rejects non-youtube video', () => {
  assert.equal(parseEntry(dest({ videos: ['https://vimeo.com/1'] })).ok, false);
});

test('rejects month 13', () => {
  assert.equal(parseEntry(dest({ bestMonths: [1, 13] })).ok, false);
});

test('unknown type rejected', () => {
  const r = parseEntry({ ...fortKochi, type: 'castle' });
  assert.equal(r.ok, false);
  assert.match(r.error, /type/);
});

test('non-object input rejected without throwing', () => {
  for (const v of [null, 'x', 42, []]) assert.equal(parseEntry(v).ok, false);
});

test('youtubeId reads the three url forms', () => {
  for (const u of ['https://www.youtube.com/watch?v=abc123DEF_-', 'https://youtu.be/abc123DEF_-', 'https://www.youtube.com/shorts/abc123DEF_-']) {
    assert.equal(youtubeId(u), 'abc123DEF_-', u);
  }
  assert.equal(youtubeId('https://example.com/watch?v=abc123DEF_-'), null);
  assert.equal(youtubeId('not a url'), null);
});

test('festival, stay and traveller-plan minimal entries parse', () => {
  assert.equal(parseEntry({ type: 'festival', slug: 'onam', name: 'Onam', months: [8, 9], where: 'Statewide', note: 'Harvest.' }).ok, true);
  assert.equal(parseEntry({ type: 'stay', slug: 'x', name: 'X', summary: 's', lat: 10, lng: 76, bestMonths: [1], kind: 'homestay', area: 'Munnar' }).ok, true);
  const plan = {
    type: 'traveller-plan', slug: 'p', name: 'P', tags: ['culture'], stops: 'kochi:2', consent: 'Example only',
    person: { name: 'N', knownFor: 'K', note: 'Hi', works: [], links: ['https://example.com'] },
    days: [{ d: '1', place: 'Kochi', what: 'Walk' }],
  };
  assert.equal(parseEntry(plan).ok, true);
  assert.equal(parseEntry({ ...plan, person: { ...plan.person, links: ['javascript:x'] } }).ok, false);
});

test('every content file passes its schema', () => {
  const folders = { destinations: 'destination', festivals: 'festival', experiences: 'experience', itineraries: 'itinerary', stays: 'stay', 'traveller-plans': 'traveller-plan' };
  for (const [dir, type] of Object.entries(folders)) {
    let entries = [];
    try { entries = loadFolder(dir); } catch { continue; } // folder not created yet
    for (const e of entries) {
      const r = parseEntry({ type, ...e });
      assert.equal(r.ok, true, `${dir}/${e.slug}: ${r.error}`);
    }
  }
});

test('every docs example parses, one per type', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const dir = new URL('../docs/examples/', import.meta.url);
  const types = readdirSync(dir).map((f) => {
    const r = parseEntry(JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
    assert.equal(r.ok, true, `${f}: ${r.error}`);
    return r.type;
  });
  assert.deepEqual(types.sort(), [...TYPES].sort());
});

test('experience link must be https or a site path', () => {
  const exp = (href) => ({ type: 'experience', slug: 'e', name: 'E', icon: 'food', text: 't', tips: [], link: { href, label: 'More' } });
  assert.equal(parseEntry(exp('https://www.keralatourism.org/')).ok, true);
  assert.equal(parseEntry(exp('/destinations/munnar')).ok, true);
  assert.equal(parseEntry(exp('javascript:alert(1)')).ok, false);
  assert.equal(parseEntry(exp('//evil.example')).ok, false);
});
