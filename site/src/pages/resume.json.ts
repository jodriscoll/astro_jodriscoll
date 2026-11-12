import type { APIRoute } from 'astro';
import { buildJsonResume } from '../agent';
import { loadBundle } from '../agent/site';

// JSON Resume v1, for ATS importers and agents that already speak it.
export const GET: APIRoute = async ({ site }) =>
  new Response(JSON.stringify(buildJsonResume(await loadBundle(site)), null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
