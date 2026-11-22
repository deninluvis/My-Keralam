// Card markup for entries imported in the browser. Every piece of text is escaped; only https links are used.
import { youtubeId } from './schemas.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const safe = (u) => (typeof u === 'string' && u.startsWith('https://') ? esc(u) : null);
const link = (u, text) => (safe(u) ? `<a href="${safe(u)}" rel="noopener nofollow">${esc(text)}</a>` : '');
const months = (ms) => (ms?.length ? ms.map((m) => MONTHS[m - 1]).join(', ') : '');
const list = (items) => (items?.length ? `<ul class="small">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '');
const days = (ds) => (ds?.length ? `<ol class="small">${ds.map((d) => `<li><strong>Day ${esc(d.d)} · ${esc(d.place)}</strong>: ${esc(d.what)}</li>`).join('')}</ol>` : '');

function media(e) {
  const imgs = (e.images || []).filter((i) => safe(i.url))
    .map((i) => `<figure><img src="${safe(i.url)}" alt="" loading="lazy" /><figcaption class="small muted">Photo: ${esc(i.credit)} · ${safe(i.source) ? `<a href="${safe(i.source)}" rel="noopener">${esc(i.license)}</a>` : esc(i.license)}</figcaption></figure>`);
  const vids = (e.videos || []).map(youtubeId).filter(Boolean)
    .map((id) => `<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}" title="Video: ${esc(e.name)}" loading="lazy" allowfullscreen></iframe>`);
  return imgs.length || vids.length ? `<div class="imp-media">${imgs.join('')}${vids.join('')}</div>` : '';
}

function body(type, e) {
  switch (type) {
    case 'festival': return `<p class="meta"><span>${months(e.months)}</span><span>${esc(e.where)}</span></p><p class="small">${esc(e.note)}</p>`;
    case 'experience': return `<p class="small">${esc(e.text)}</p>${list(e.tips)}`;
    case 'itinerary': return `<p class="small muted">${esc(e.who)}</p>${days(e.days)}`;
    case 'stay': return `<p class="meta"><span class="tag">${esc(e.kind)}</span><span>${esc(e.area)}</span>${e.priceRange ? `<span>${esc(e.priceRange)}</span>` : ''}</p><p class="small">${esc(e.summary)}</p>${link(e.website, 'Website')}`;
    case 'food': {
      const SPICE = ['Not spicy', 'Mild', 'Medium', 'Hot'];
      const places = (e.places || []).map((p) => `<li>${link(p.mapLink, p.name) || esc(p.name)}${p.area ? `, ${esc(p.area)}` : ''}${p.website ? ` · ${link(p.website, 'website')}` : ''}</li>`).join('');
      return `<p class="meta"><span class="tag">${esc(e.kind)}</span><span class="tag">${e.veg ? 'Vegetarian' : 'Non-veg'}</span><span>${esc(SPICE[e.spice] || '')}</span></p><p class="small">${esc(e.desc)}</p>${places ? `<p class="small"><strong>Where to try it:</strong></p><ul class="small">${places}</ul>` : ''}`;
    }
    case 'traveller-plan': {
      const p = e.person || {};
      return `<p class="small"><strong>${esc(p.name)}</strong>, ${esc(p.knownFor)}</p><blockquote class="small">${esc(p.note)}</blockquote>${list(p.works)}${(p.links || []).map((u) => link(u, u)).join(' ')}${days(e.days)}`;
    }
    default: return `<p class="small">${esc(e.summary)}</p>${e.bestMonths ? `<p class="meta"><span>Best: ${months(e.bestMonths)}</span></p>` : ''}`;
  }
}

export function cardHtml(type, e) {
  const extra = [
    e.why ? `<p class="small"><strong>Why go:</strong> ${esc(e.why)}</p>` : '',
    media(e),
    link(e.streetView, 'Street View'),
    link(e.officialLink, 'Official page'),
    e.author ? `<p class="small muted">Added by ${esc(e.author)}</p>` : '',
  ].join(' ');
  return `<div class="card imp"><span class="tag">Imported by you</span><h3>${esc(e.name)}</h3>${body(type, e)}${extra}</div>`;
}
