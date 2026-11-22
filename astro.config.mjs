import { defineConfig } from 'astro/config';

// GitHub Pages serves the site at /<repo>/. Override with SITE_BASE if hosting elsewhere.
export default defineConfig({
  site: process.env.SITE_URL || 'https://deninluvis.github.io',
  base: process.env.SITE_BASE || '/soul-of-keralam-Your-insider-pass-to-Kerala',
  trailingSlash: 'ignore',
});
