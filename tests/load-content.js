import { readdirSync, readFileSync } from 'node:fs';

// Test helper: read a content folder the way the site sees it (sorted by order).
export function loadFolder(dir) {
  const base = new URL(`../src/content/${dir}/`, import.meta.url);
  return readdirSync(base).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, base), 'utf8')))
    .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
}
