import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-content-gateway', 'jodriscoll');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
