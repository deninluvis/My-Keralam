// Build a link that respects the site's base path (e.g. /My-Keralam on GitHub Pages).
export function url(path = '/') {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}` || '/';
}
