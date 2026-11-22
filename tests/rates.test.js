import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toInrRates, plausible } from '../scripts/update-rates.mjs';

// Shape of https://api.frankfurter.dev/v1/latest?base=INR&symbols=...
const api = { amount: 1, base: 'INR', date: '2026-11-20', rates: { AUD: 0.016188, CAD: 0.015437, EUR: 0.0098184, GBP: 0.0082214, USD: 0.01079 } };

test('converts "foreign per rupee" into "rupees per foreign unit", rounded to 2 decimals', () => {
  const { rates, date } = toInrRates(api, ['USD', 'EUR', 'GBP', 'CAD', 'AUD']);
  assert.equal(date, '2026-11-20');
  assert.equal(rates.USD, 92.68);
  assert.equal(rates.EUR, 101.85);
  assert.equal(rates.GBP, 121.63);
});

test('AED comes from the fixed USD peg (3.6725 AED per USD)', () => {
  const { rates } = toInrRates(api, ['USD', 'AED']);
  assert.equal(rates.AED, 25.24); // 1 / (0.01079 USD per rupee x 3.6725 AED per USD)
});

test('missing or bad data throws, so the old rates are kept', () => {
  assert.throws(() => toInrRates({ date: '2026-11-20', rates: { USD: 0.01 } }, ['USD', 'EUR']), /EUR/);
  assert.throws(() => toInrRates({ date: '2026-11-20', rates: { USD: 0 } }, ['USD']), /USD/);
  assert.throws(() => toInrRates({}, ['USD']));
});

test('a rate that more than doubles or halves since last time is rejected', () => {
  const old = { USD: 92, EUR: 101 };
  assert.equal(plausible({ USD: 93, EUR: 100 }, old), true);
  assert.equal(plausible({ USD: 340, EUR: 100 }, old), false);
  assert.equal(plausible({ USD: 40, EUR: 100 }, old), false);
  assert.equal(plausible({ USD: 93, EUR: 100, GBP: 120 }, old), true); // new currency: nothing to compare
});
