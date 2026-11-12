import type { APIRoute } from 'astro';
import { contentResponse, optionsResponse, segmentsOf } from '../../../gateway/http';

export const prerender = false;

export const OPTIONS: APIRoute = () => optionsResponse();

export const GET: APIRoute = (context) => contentResponse(context, segmentsOf(context.params.path));
