// Saved trips, kept only in this browser (localStorage key "trips"), newest first.
const KEY = 'trips';
const local = () => { try { return globalThis.localStorage; } catch { return undefined; } };

function read(storage) {
  try { const v = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function write(list, storage) {
  try { storage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; }
}

export function listTrips(storage = local()) {
  if (!storage) return [];
  let list = read(storage);
  let legacy = null;
  try { legacy = storage.getItem('trip'); } catch { /* blocked */ }
  if (legacy) {
    // One-time move of the old single saved trip into the list.
    list = [{ id: `t${Date.now()}`, name: 'My trip', query: legacy, savedAt: new Date().toISOString() }, ...list];
    if (write(list, storage)) { try { storage.removeItem('trip'); } catch { /* keep it */ } }
  }
  return list;
}

export function saveTrip({ id, name, query }, storage = local()) {
  if (!storage) return { ok: false, error: 'Browser storage is not available.' };
  const list = listTrips(storage);
  const trip = { id: id || `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: String(name || '').trim() || 'My trip', query, savedAt: new Date().toISOString() };
  const i = list.findIndex((t) => t.id === trip.id);
  if (i >= 0) list[i] = trip; else list.unshift(trip);
  return write(list, storage) ? { ok: true, trip } : { ok: false, error: 'Could not save: browser storage is full or blocked.' };
}

export function renameTrip(id, name, storage = local()) {
  const list = listTrips(storage);
  const t = list.find((x) => x.id === id);
  if (t) { t.name = String(name || '').trim() || t.name; write(list, storage); }
}

export function deleteTrip(id, storage = local()) {
  write(listTrips(storage).filter((t) => t.id !== id), storage);
}
