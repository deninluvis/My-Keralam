// Community entries a visitor loads in their own browser. Stored only in this browser (localStorage).
import { parseEntry } from './schemas.js';

const key = (type) => `community:${type}`;
const local = () => { try { return globalThis.localStorage; } catch { return undefined; } };

function read(type, storage) {
  try { const v = JSON.parse(storage.getItem(key(type)) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function listImported(type, storage = local()) {
  if (!storage) return [];
  return read(type, storage).map((e) => ({ ...e, imported: true }));
}

export function importText(text, storage = local()) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { added: 0, errors: ['The file is not valid JSON.'] }; }
  const errors = [];
  const byType = {};
  (Array.isArray(parsed) ? parsed : [parsed]).forEach((obj, i) => {
    const r = parseEntry(obj);
    if (!r.ok) { errors.push(`Entry ${i + 1}${obj?.slug ? ` (${obj.slug})` : ''}: ${r.error}`); return; }
    (byType[r.type] ||= []).push(r.data);
  });
  if (!storage) return { added: 0, errors: [...errors, 'Browser storage is not available.'] };
  let added = 0;
  for (const [type, entries] of Object.entries(byType)) {
    const list = read(type, storage);
    for (const e of entries) {
      const i = list.findIndex((x) => x.slug === e.slug);
      if (i >= 0) list[i] = e; else list.push(e);
    }
    try { storage.setItem(key(type), JSON.stringify(list)); added += entries.length; } catch { errors.push(`Could not store ${type} entries: browser storage is full or blocked.`); }
  }
  return { added, errors };
}

export function removeImported(type, slug, storage = local()) {
  if (!storage) return;
  try { storage.setItem(key(type), JSON.stringify(read(type, storage).filter((e) => e.slug !== slug))); } catch { /* nothing to remove */ }
}
