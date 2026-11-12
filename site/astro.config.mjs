import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import remarkFigures from './src/lib/figures.mjs';

// Astro 7's default Markdown engine (Satteri) has no remark plugins. The figure
// fences (bars, steps, timeline, before-after) need the unified pipeline, so
// they switch on only when @astrojs/markdown-remark is installed.
let remarkPlugins = [];
try {
  await import('@astrojs/markdown-remark');
  remarkPlugins = [remarkFigures];
} catch {}

export default defineConfig({
  site: 'https://jodriscoll.com',
  output: 'static',
  publicDir: 'static',
  // Cloudflare Workers (the domain and its DNS live on Cloudflare). Static pages
  // prerender in Node at build time; the /api routes run on the Worker.
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  // The Astro dev toolbar sits over the bottom of the page in dev and gets in
  // the way of the mobile Download bar; it never ships, so it's off.
  devToolbar: { enabled: false },
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  vite: {
    server: {
      // *.localhost resolves here, including dotcom.localhost.
      allowedHosts: ['.localhost', 'localhost', 'dotcom.localhost'],
    },
  },
  markdown: {
    remarkPlugins,
    shikiConfig: {
      // Dual themes: Shiki writes the dark colour inline (the default and the
      // fallback) and the light one as --shiki-light; shell.css swaps to it
      // under :root[data-theme="light"], so the site toggle drives it.
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'dark',
      // ```css title="icon-grid.css" puts the file name on <pre data-title>, which the
      // blog post turns into the code block's tab.
      transformers: [
        {
          name: 'code-title',
          pre(node) {
            const meta = this.options.meta?.__raw ?? '';
            const title = meta.match(/(?:title|file)=["']([^"']+)["']/)?.[1];
            if (title) node.properties['data-title'] = title;
          },
        },
      ],
    },
  },
});

