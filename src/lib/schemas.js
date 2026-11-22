// One schema per community content type. Used by the build (src/content.config.js)
// and by the browser import (src/lib/community.js), so both accept exactly the same files.
import { z } from 'astro/zod';

export const TYPES = ['destination', 'festival', 'experience', 'itinerary', 'stay', 'traveller-plan'];

export function youtubeId(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/shorts\/([^/]+)/) || [])[1];
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}

const https = z.string().url().refine((s) => s.startsWith('https://'), 'must start with https://');
const month = z.number().int().min(1).max(12);
const day = z.object({ d: z.string(), place: z.string(), what: z.string() });

const common = {
  slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and hyphens only'),
  name: z.string().min(1),
  summary: z.string().min(1),
  lat: z.number().min(8).max(13.5),
  lng: z.number().min(74).max(78),
  bestMonths: z.array(month).min(1),
  why: z.string().optional(),
  streetView: https.refine((s) => new URL(s).hostname.includes('google.'), 'must be a Google Maps link').optional(),
  images: z.array(z.object({ url: https, credit: z.string().min(1), license: z.string().min(1) })).optional(),
  videos: z.array(https.refine((s) => youtubeId(s) !== null, 'must be a YouTube link')).optional(),
  officialLink: https.optional(),
  author: z.string().optional(),
  order: z.number().optional(),
};
const placeOptional = { summary: common.summary.optional(), lat: common.lat.optional(), lng: common.lng.optional(), bestMonths: common.bestMonths.optional() };

export const schemas = {
  destination: z.object({
    ...common,
    categories: z.array(z.string()).min(1),
    region: z.enum(['south', 'central', 'north']),
    district: z.string(),
    days: z.string(),
    airport: z.string(),
    fromKochi: z.string(),
    todo: z.array(z.string()),
    base: z.string().optional(),
  }),
  festival: z.object({ ...common, ...placeOptional, months: z.array(month).min(1), where: z.string(), note: z.string(), link: https.optional() }),
  experience: z.object({
    ...common, ...placeOptional,
    icon: z.string(), text: z.string(), tips: z.array(z.string()),
    link: z.object({ href: z.string(), label: z.string() }),
  }),
  itinerary: z.object({ ...common, ...placeOptional, who: z.string(), q: z.string(), days: z.array(day).min(1) }),
  stay: z.object({
    ...common,
    kind: z.enum(['hotel', 'homestay', 'rental', 'houseboat']),
    area: z.string(),
    priceRange: z.string().optional(),
    website: https.optional(),
  }),
  'traveller-plan': z.object({
    ...common, ...placeOptional,
    person: z.object({ name: z.string(), knownFor: z.string(), note: z.string(), works: z.array(z.string()), links: z.array(https) }),
    tags: z.array(z.string()).min(1),
    days: z.array(day).min(1),
    stops: z.string().regex(/^[a-z0-9-]+:\d+(,[a-z0-9-]+:\d+)*$/, 'like "kochi:2,munnar:2"'),
    consent: z.string().min(1),
    fictional: z.boolean().optional(),
  }),
};

export function parseEntry(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: 'entry must be a JSON object' };
  const { type, ...rest } = obj;
  if (!TYPES.includes(type)) return { ok: false, error: `type: must be one of ${TYPES.join(', ')}` };
  const r = schemas[type].safeParse(rest);
  if (r.success) return { ok: true, type, data: r.data };
  const issue = r.error.issues[0];
  return { ok: false, error: `${issue.path.join('.') || 'entry'}: ${issue.message}` };
}
