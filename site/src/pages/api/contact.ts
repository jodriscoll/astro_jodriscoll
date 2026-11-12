import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE =
  /^(https?:\/\/)?(localhost|([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})(?::\d{2,5})?(?:[/?#][^\s]*)?$/i;

const NAME_ERROR = 'Speaking to nothing might get me institutionalized. Can you revisit?';
const EMAIL_ERROR = "Going to be hard to respond to a blank recipient. I'll need an email.";
const SITE_ERROR = "That link doesn't look like a site yet.";
const MESSAGE_ERROR = "Hello... anybody there? We'll need something to talk about.";

const TAGS: Record<string, 'p' | 'br' | 'strong' | 'em' | 'a'> = {
  p: 'p',
  div: 'p',
  br: 'br',
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  a: 'a',
};

function env(name: 'RESEND_API_KEY' | 'RESEND_FROM'): string {
  if (!process.env[name]) {
    const fromFile = name === 'RESEND_API_KEY' ? import.meta.env.RESEND_API_KEY : import.meta.env.RESEND_FROM;
    if (typeof fromFile === 'string' && fromFile.trim()) process.env[name] = fromFile.trim();
  }
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/[\u0000-\u001f\s]+/g, '');
  if (/^mailto:/i.test(href)) {
    const address = href.slice('mailto:'.length).split('?')[0];
    if (!address || !EMAIL.test(address)) return null;
    return `mailto:${address}`;
  }
  try {
    const url = new URL(href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isSite(value: string): boolean {
  return SITE.test(value) && !/[\s<>]/.test(value);
}

export function sanitizeMessage(input: string): string {
  const source = input
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|noscript)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');

  let html = '';
  const open: string[] = [];
  const re = /<\/?\s*([a-zA-Z][\w:-]*)\b([^>]*)>|([^<]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    if (match[3]) {
      html += match[3].replace(/[<>]/g, '');
      continue;
    }
    const name = TAGS[match[1].toLowerCase()];
    if (!name) continue;
    const closing = match[0].startsWith('</');
    if (closing) {
      const index = open.lastIndexOf(name);
      if (index === -1) continue;
      while (open.length > index) {
        html += `</${open.pop()}>`;
      }
      continue;
    }
    if (name === 'br') {
      html += '<br>';
      continue;
    }
    if (name === 'a') {
      const hrefMatch = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[2] || '');
      const href = safeHref(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '');
      if (!href) continue;
      html += `<a href="${escapeText(href)}">`;
      open.push('a');
      continue;
    }
    html += `<${name}>`;
    open.push(name);
  }
  while (open.length) html += `</${open.pop()}>`;
  return html.trim();
}

function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'The message did not send. Email joey@jodriscoll.com instead.' }, 400);
  }
  if (!payload || typeof payload !== 'object') {
    return json({ error: 'The message did not send. Email joey@jodriscoll.com instead.' }, 400);
  }

  const record = payload as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const email = typeof record.email === 'string' ? record.email.trim() : '';
  const website = typeof record.website === 'string' ? record.website.trim() : '';
  const rawMessage = typeof record.message === 'string' ? record.message : '';
  const message = sanitizeMessage(rawMessage);
  const messageText = plainText(message);
  const errors: Record<string, string> = {};

  if (!name || name.length > 80 || /[\r\n]/.test(name)) errors.name = NAME_ERROR;
  if (!email || email.length > 120 || /[\r\n]/.test(email) || !EMAIL.test(email)) errors.email = EMAIL_ERROR;
  if (website && (website.length > 200 || !isSite(website))) errors.website = SITE_ERROR;
  if (!messageText || message.length > 8000) errors.message = MESSAGE_ERROR;
  if (Object.keys(errors).length) return json({ errors }, 400);

  const key = env('RESEND_API_KEY');
  const from = env('RESEND_FROM');
  if (!key || !from) {
    return json({ error: 'The contact form is not set up yet. Email joey@jodriscoll.com instead.' }, 503);
  }

  const text = [`${name} <${email}>`, website, '', messageText].filter((line) => line !== '').join('\n');
  const html = [
    `<p><strong>${escapeText(name)}</strong> &lt;${escapeText(email)}&gt;</p>`,
    website ? `<p>${escapeText(website)}</p>` : '',
    message,
  ].join('');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: ['joey@jodriscoll.com'],
        reply_to: email,
        subject: `Note from ${name}`,
        text,
        html,
      }),
    });
    if (!response.ok) {
      return json({ error: 'The message did not send. Email joey@jodriscoll.com instead.' }, 502);
    }
  } catch {
    return json({ error: 'The message did not send. Email joey@jodriscoll.com instead.' }, 502);
  }

  return json({ ok: true }, 200);
};
