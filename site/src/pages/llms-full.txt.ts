import type { APIRoute } from 'astro';
import { buildLlmsFullTxt } from '../agent';
import { loadBundle } from '../agent/site';

// Every public fact on the site, in one plain-text file.
export const GET: APIRoute = async ({ site }) =>
  new Response(buildLlmsFullTxt(await loadBundle(site)), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
