import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = JSON.parse(await request.text()) as { event?: unknown; label?: unknown; kind?: unknown };
    if (typeof body.event !== 'string' || body.event.length === 0 || body.event.length > 80) {
      return new Response(null, { status: 400 });
    }
    if (body.kind !== 'click' && body.kind !== 'hover') {
      return new Response(null, { status: 400 });
    }
    if (body.label !== undefined && typeof body.label !== 'string') {
      return new Response(null, { status: 400 });
    }
  } catch {
    return new Response(null, { status: 400 });
  }
  return new Response(null, { status: 204 });
};
