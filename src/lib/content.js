import { getCollection } from 'astro:content';

// Entry data for a collection, in `order` (then name) so the display order is stable.
export async function all(name) {
  const list = (await getCollection(name)).map((e) => e.data);
  return list.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.name.localeCompare(b.name));
}
