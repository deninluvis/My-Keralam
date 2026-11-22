import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { schemas } from './lib/schemas.js';

// One JSON file per entry. Add a file to a folder to add an entry; see docs/CONTRIBUTING-DATA.md.
const folder = (dir, type) => defineCollection({ loader: glob({ pattern: '*.json', base: `./src/content/${dir}` }), schema: schemas[type] });

export const collections = {
  destinations: folder('destinations', 'destination'),
  festivals: folder('festivals', 'festival'),
  experiences: folder('experiences', 'experience'),
  itineraries: folder('itineraries', 'itinerary'),
  stays: folder('stays', 'stay'),
  travellerPlans: folder('traveller-plans', 'traveller-plan'),
};
