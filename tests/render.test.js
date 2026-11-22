import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, cardHtml } from '../src/lib/render.js';

const evil = '<img src=x onerror=alert(1)>';

test('esc escapes html special characters', () => {
  assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('cardHtml never outputs markup from entry text', () => {
  for (const type of ['destination', 'festival', 'experience', 'itinerary', 'stay', 'traveller-plan']) {
    const html = cardHtml(type, {
      slug: 'x', name: evil, summary: evil, why: evil, where: evil, note: evil, text: evil, who: evil, area: evil,
      tips: [evil], months: [1], bestMonths: [1], days: [{ d: evil, place: evil, what: evil }], tags: [evil],
      person: { name: evil, knownFor: evil, note: evil, works: [evil], links: [] }, stops: 'kochi:1', kind: 'hotel',
    });
    assert.equal(html.includes('<img'), false, type);
    assert.match(html, /Imported by you/, type);
  }
});

test('videos embed through youtube-nocookie by id', () => {
  const html = cardHtml('destination', { slug: 'x', name: 'X', summary: 's', videos: ['https://youtu.be/abc123DEF_-'] });
  assert.match(html, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/abc123DEF_-"/);
});

test('images show with their credit', () => {
  const html = cardHtml('stay', { slug: 'x', name: 'X', summary: 's', kind: 'hotel', area: 'Kochi', images: [{ url: 'https://e.com/a.jpg', credit: 'Ann', license: 'CC0' }] });
  assert.match(html, /<img src="https:\/\/e\.com\/a\.jpg"/);
  assert.match(html, /Ann/);
});
