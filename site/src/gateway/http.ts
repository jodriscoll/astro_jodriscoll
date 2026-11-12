import type { APIContext } from 'astro';
import { GATEWAY, GATEWAY_VERSION, queryContent } from './index';
import { draftsAllowed } from './protect';
import { resolveStack } from './stacks';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type, x-content-token',
};

function json(body: unknown, status: number, cache: string): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
      ...CORS,
    },
  });
}

export function segmentsOf(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param.filter(Boolean);
  return param.split('/').filter(Boolean);
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function contentResponse(context: APIContext, segments: string[]): Promise<Response> {
  const stack = resolveStack(context.url, context.request.headers.get('host') ?? '');
  if (stack === 'invalid') {
    return json({ gateway: GATEWAY, version: GATEWAY_VERSION, error: 'unknown_stack' }, 400, 'no-store');
  }

  const wantsDrafts = context.url.searchParams.get('drafts') === '1';
  if (wantsDrafts && !draftsAllowed(context.request.headers.get('x-content-token'))) {
    return json({ gateway: GATEWAY, version: GATEWAY_VERSION, error: 'unauthorized' }, 401, 'no-store');
  }

  const result = await queryContent(segments, { stack, includeDrafts: wantsDrafts });
  if (!result.ok) {
    return json({ gateway: GATEWAY, version: GATEWAY_VERSION, error: result.error }, result.status, 'no-store');
  }

  return json(result.body, 200, wantsDrafts ? 'private, no-store' : 'public, max-age=60, s-maxage=3600');
}
