import type { APIRoute } from 'astro';
import { listPosts } from '../gateway';
import { escapeXml } from '../gateway/xml';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://jodriscoll.com';
  const posts = await listPosts();
  const items = posts
    .map((post) => {
      const link = `${origin}/blog/${post.id}`;
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Joseph O'Driscoll</title>
    <link>${escapeXml(origin)}</link>
    <description>Notes on front-end engineering, performance, and content systems.</description>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
