import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '../agent';
import { loadBundle } from '../agent/site';

// https://llmstxt.org: the one-request summary an agent reads first.
export const GET: APIRoute = async ({ site }) =>
  new Response(buildLlmsTxt(await loadBundle(site)), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
