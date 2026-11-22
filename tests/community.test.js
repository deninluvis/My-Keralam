import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importText, listImported, removeImported } from '../src/lib/community.js';

const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const fest = (slug, extra = {}) => ({ type: 'festival', slug, name: slug, months: [1], where: 'Kochi', note: 'n', ...extra });

test('valid entries are stored, invalid ones reported', () => {
  const s = memory();
  const r = importText(JSON.stringify([fest('a'), fest('b'), fest('c', { months: [13] })]), s);
  assert.equal(r.added, 2);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /months/);
  assert.deepEqual(listImported('festival', s).map((e) => e.slug), ['a', 'b']);
  assert.equal(listImported('festival', s)[0].imported, true);
});

test('a single object is accepted', () => {
  const s = memory();
  assert.equal(importText(JSON.stringify(fest('solo')), s).added, 1);
});

test('re-importing a slug replaces it instead of duplicating', () => {
  const s = memory();
  importText(JSON.stringify(fest('a')), s);
  importText(JSON.stringify(fest('a', { where: 'Munnar' })), s);
  const list = listImported('festival', s);
  assert.equal(list.length, 1);
  assert.equal(list[0].where, 'Munnar');
});

test('removeImported deletes one entry', () => {
  const s = memory();
  importText(JSON.stringify([fest('a'), fest('b')]), s);
  removeImported('festival', 'a', s);
  assert.deepEqual(listImported('festival', s).map((e) => e.slug), ['b']);
});

test('bad JSON gives an error, no throw', () => {
  const r = importText('not json', memory());
  assert.equal(r.added, 0);
  assert.equal(r.errors.length, 1);
});

test('throwing storage gives an error, no throw', () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} };
  const r = importText(JSON.stringify(fest('a')), broken);
  assert.equal(r.added, 0);
  assert.match(r.errors[0], /stor/i);
});

test('corrupt stored value reads as empty', () => {
  const s = memory();
  s.setItem('community:festival', '{oops');
  assert.deepEqual(listImported('festival', s), []);
});
