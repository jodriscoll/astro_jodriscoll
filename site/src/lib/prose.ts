// Prose enrichment for project descriptions: the first mention of a known
// technology links to its official site, and figures that read as specs
// (480×272, 1–4×, 12.2, 0.1.0) are set in the red monospace. Input is plain
// text; the output is escaped HTML for set:html. Links carry a red wavy underline.

const HOMEPAGES: [RegExp, string][] = [
  [/\bReact Native\b/, 'https://reactnative.dev'],
  [/\bNext\.js\b/, 'https://nextjs.org'],
  [/\bReact\b/, 'https://react.dev'],
  [/\bTypeScript\b/, 'https://www.typescriptlang.org'],
  [/\bJavaScript\b/, 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'],
  [/\bNode(?:\.js)?\b/, 'https://nodejs.org'],
  [/\bPhaser\b/, 'https://phaser.io'],
  [/\bVite\b/, 'https://vite.dev'],
  [/\bGhidra\b/, 'https://ghidra-sre.org'],
  [/\bFFmpeg\b|\bffmpeg\b/, 'https://ffmpeg.org'],
  [/\bWebGL\b/, 'https://www.khronos.org/webgl/'],
  [/\bJava\b(?!Script)/, 'https://dev.java'],
  [/\bWordPress\b/, 'https://wordpress.org'],
  [/\bDrupal\b/, 'https://www.drupal.org'],
  [/\bCraft Cloud\b/, 'https://craftcms.com/cloud'],
  [/\bCraft(?: CMS)?\b/, 'https://craftcms.com'],
  [/\bAngular\b/, 'https://angular.dev'],
  [/\bVue\b/, 'https://vuejs.org'],
  [/\bSvelte\b/, 'https://svelte.dev'],
  [/\bAstro\b/, 'https://astro.build'],
  [/\bExpo\b/, 'https://expo.dev'],
  [/\bSupabase\b/, 'https://supabase.com'],
  [/\bShopify\b/, 'https://www.shopify.com'],
  [/\bSymfony\b/, 'https://symfony.com'],
  [/\bPHP\b/, 'https://www.php.net'],
  [/\bPython\b/, 'https://www.python.org'],
  [/\bRuby\b/, 'https://www.ruby-lang.org'],
  [/\bSass\b|\bSCSS\b/, 'https://sass-lang.com'],
  [/\bTailwind(?: CSS)?\b/, 'https://tailwindcss.com'],
  [/\bBootstrap\b/, 'https://getbootstrap.com'],
  [/\bTimber\b/, 'https://upstatement.com/timber/'],
  [/\bTwig\b/, 'https://twig.symfony.com'],
  [/\bjQuery\b/, 'https://jquery.com'],
  [/\bAlpine\.js\b/, 'https://alpinejs.dev'],
  [/\bThree\.js\b/, 'https://threejs.org'],
  [/\bStorybook\b/, 'https://storybook.js.org'],
  [/\bwebpack\b/, 'https://webpack.js.org'],
  [/\bGulp\b/, 'https://gulpjs.com'],
  [/\bMySQL\b/, 'https://www.mysql.com'],
  [/\bMariaDB\b/, 'https://mariadb.org'],
  [/\bRedis\b/, 'https://redis.io'],
  [/\bnginx\b/, 'https://nginx.org'],
  [/\bVercel\b/, 'https://vercel.com'],
  [/\bNetlify\b/, 'https://www.netlify.com'],
  [/\bCloudflare\b/, 'https://www.cloudflare.com'],
  [/\bPantheon\b/, 'https://pantheon.io'],
  [/\bWP Engine\b/, 'https://wpengine.com'],
  [/\bKinsta\b/, 'https://kinsta.com'],
  [/\bAWS\b/, 'https://aws.amazon.com'],
  [/\bWebflow\b/, 'https://webflow.com'],
  [/\bCodePen\b/, 'https://codepen.io'],
  [/\bGitHub Actions\b/, 'https://github.com/features/actions'],
  [/\bGitLab\b/, 'https://about.gitlab.com'],
  [/\bSwift\b/, 'https://www.swift.org'],
];

// Spec-like figures: sizes (480×272), multipliers (1–4×, 2x), dotted versions (12.2, 0.1.0).
const FIGURE = /\b\d+\s?×\s?\d+\b|\b\d+(?:[–-]\d+)?×(?!\w)|\b\d+\.\d+(?:\.\d+)*\b/g;

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function enrich(text: string): string {
  if (!text) return '';
  // Find link spans first (first mention of each technology), then figures
  // outside them; build the output left to right.
  type Span = { start: number; end: number; html: string };
  const spans: Span[] = [];
  const overlaps = (a: number, b: number) => spans.some((s) => a < s.end && b > s.start);

  for (const [pattern, href] of HOMEPAGES) {
    const match = pattern.exec(text);
    if (!match || overlaps(match.index, match.index + match[0].length)) continue;
    const start = match.index;
    // A version right after the name ("Phaser 4", "Ghidra 12.2") belongs to the link.
    const version = /^ \d+(?:\.\d+)*\b(?![×\d])/.exec(text.slice(start + match[0].length));
    const end = start + match[0].length + (version ? version[0].length : 0);
    spans.push({
      start,
      end,
      html: `<a class="prose-link" href="${href}" rel="noopener" target="_blank">${escape(text.slice(start, end))}</a>`,
    });
  }

  for (const match of text.matchAll(FIGURE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (overlaps(start, end)) continue;
    spans.push({ start, end, html: `<span class="prose-fig">${escape(match[0])}</span>` });
  }

  spans.sort((a, b) => a.start - b.start);
  let out = '';
  let at = 0;
  for (const span of spans) {
    out += escape(text.slice(at, span.start)) + span.html;
    at = span.end;
  }
  return out + escape(text.slice(at));
}
