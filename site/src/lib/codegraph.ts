// A code-minimap backdrop: rows of "code" whose colours follow the project's
// language mix. Measured languages come from a spec file; otherwise the mix is
// read from the technology list and marked as inferred.

export type LanguageShare = { name: string; share: number; color: string };

const COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  PHP: '#777bb4',
  Twig: '#c1d026',
  CSS: '#663399',
  SCSS: '#c6538c',
  HTML: '#e34c26',
  Ruby: '#cc342d',
  Python: '#3572a5',
  SQL: '#e38c00',
  Swift: '#f05138',
  Shell: '#89e051',
  Vue: '#41b883',
  Liquid: '#67b8de',
};

const INFER: [RegExp, Record<string, number>][] = [
  [/wordpress|acf|bedrock/i, { PHP: 5, JavaScript: 2, SCSS: 2, HTML: 1 }],
  [/craft/i, { Twig: 4, PHP: 3, JavaScript: 2, CSS: 1 }],
  [/drupal/i, { PHP: 5, Twig: 2, JavaScript: 2, SCSS: 1 }],
  [/symfony|symphony/i, { PHP: 4, Twig: 1 }],
  [/vue/i, { Vue: 3, JavaScript: 2 }],
  [/react|next|expo/i, { TypeScript: 4, JavaScript: 2, CSS: 1 }],
  [/angular/i, { TypeScript: 5, SCSS: 2, HTML: 2 }],
  [/ruby/i, { Ruby: 4, HTML: 1 }],
  [/python/i, { Python: 2 }],
  [/shopify|webflow/i, { Liquid: 3, JavaScript: 2, CSS: 2 }],
  [/scss|sass/i, { SCSS: 2 }],
  [/javascript|es6|es5/i, { JavaScript: 2 }],
  [/typescript/i, { TypeScript: 3 }],
  [/mysql|sql/i, { SQL: 1 }],
];

export function languageMix(input: { measured?: { name: string; bytes: number }[]; technologies: string[] }): {
  items: LanguageShare[];
  measured: boolean;
} {
  if (input.measured?.length) {
    const total = input.measured.reduce((sum, item) => sum + item.bytes, 0);
    return {
      measured: true,
      items: input.measured.map((item) => ({ name: item.name, share: item.bytes / total, color: COLORS[item.name] ?? '#888' })),
    };
  }
  const weights: Record<string, number> = {};
  const blob = input.technologies.join(' ');
  for (const [pattern, mix] of INFER) {
    if (!pattern.test(blob)) continue;
    for (const [name, weight] of Object.entries(mix)) weights[name] = (weights[name] ?? 0) + weight;
  }
  if (!Object.keys(weights).length) Object.assign(weights, { HTML: 2, CSS: 2, JavaScript: 2 });
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return {
    measured: false,
    items: Object.entries(weights)
      .map(([name, weight]) => ({ name, share: weight / total, color: COLORS[name] ?? '#888' }))
      .sort((a, b) => b.share - a.share),
  };
}

function random(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Token = { x: number; w: number; color: string };

// Rows of tokens. Each row picks a language by share, indents like code,
// and splits into a few token widths.
export function minimap(seed: string, mix: LanguageShare[], rows = 46): Token[][] {
  const rand = random(seed);
  const pick = () => {
    let r = rand();
    for (const item of mix) {
      r -= item.share;
      if (r <= 0) return item.color;
    }
    return mix[0]?.color ?? '#888';
  };
  let indent = 0;
  const out: Token[][] = [];
  for (let i = 0; i < rows; i++) {
    if (rand() < 0.12) {
      out.push([]);
      continue;
    }
    const change = rand();
    if (change < 0.22 && indent < 4) indent++;
    else if (change > 0.78 && indent > 0) indent--;
    const color = pick();
    const tokens: Token[] = [];
    let x = indent * 4;
    const count = 1 + Math.floor(rand() * 4);
    for (let t = 0; t < count && x < 96; t++) {
      const w = 3 + Math.floor(rand() * 16);
      tokens.push({ x, w: Math.min(w, 100 - x), color: t === 0 || rand() > 0.5 ? color : pick() });
      x += w + 1.5;
    }
    out.push(tokens);
  }
  return out;
}
