// The Astro side of the agent layer: loads public records once per build and
// hands them to the pure mapping in map.ts. It reads the gateway, never the
// raw JSON, so drafts and `internal` notes cannot leak into the graph.

import { getCollection } from 'astro:content';
import { getProfile, getResume, listPosts, listProjects } from '../gateway';
import { toBundle } from './map';
import type { Bundle } from './types';

export { weaknesses } from './map';
export type { Essay } from './map';

async function build(origin: string): Promise<Bundle> {
  const specs = new Map((await getCollection('specs')).map((entry) => [entry.data.slug, entry.data]));
  return toBundle({
    origin,
    profile: getProfile(),
    resume: getResume(),
    projects: listProjects(),
    specs,
    entries: await listPosts(),
  });
}

const cache = new Map<string, Promise<Bundle>>();

/** Built once per origin per build; every page and endpoint shares it. */
export function loadBundle(site: URL | string | undefined): Promise<Bundle> {
  const origin = (site ? String(site) : 'https://jodriscoll.com').replace(/\/$/, '');
  let bundle = cache.get(origin);
  if (!bundle) {
    bundle = build(origin);
    cache.set(origin, bundle);
  }
  return bundle;
}
