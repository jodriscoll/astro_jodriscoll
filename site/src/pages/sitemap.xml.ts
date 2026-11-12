import type { APIRoute } from 'astro';
import { listPosts, listProjects } from '../gateway';
import { escapeXml } from '../gateway/xml';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://jodriscoll.com';
  const [posts, projects] = await Promise.all([listPosts(), Promise.resolve(listProjects())]);
  const built = new Date().toISOString().slice(0, 10);
  const newest = posts[0]?.data.date.toISOString().slice(0, 10) ?? built;
  // lastmod only where a real date exists: posts carry theirs, and pages that
  // are generated from the records change with every build.
  const entries: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: built },
    { path: '/resume', lastmod: built },
    { path: '/things-built', lastmod: built },
    { path: '/technologies' },
    { path: '/blog', lastmod: newest },
    { path: '/weaknesses' },
    ...projects.map((project) => ({ path: `/things-built/${project.slug}` })),
    ...posts.map((post) => ({ path: `/blog/${post.id}`, lastmod: post.data.date.toISOString().slice(0, 10) })),
  ];
  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = `<loc>${escapeXml(`${origin}${path}`)}</loc>`;
      return `  <url>${loc}${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
