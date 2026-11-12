import type { PublicProject } from '../gateway';

// Counts how many public projects use each technology. Records list tools in
// different shapes ("PHP + MySQL", "Bootstrap 5.x", "WordPress Multisite"),
// so names are split and folded to one family before counting.

const FAMILIES: [RegExp, string][] = [
  [/^wordpress( multisite| vip)?$/i, 'WordPress'],
  [/^(php \+ )?wordpress \+ acf$/i, 'WordPress'],
  [/^craft( cms)?/i, 'Craft CMS'],
  [/^vue(js)?/i, 'Vue'],
  [/^react( \d+)?/i, 'React'],
  [/^angular/i, 'Angular'],
  [/^bootstrap/i, 'Bootstrap'],
  [/^javascript/i, 'JavaScript'],
  [/^(s?css|scss|html5)$/i, 'HTML and SCSS'],
  [/^symphony$/i, 'Symfony'],
  [/^aws|cloudfront/i, 'AWS'],
  [/^php( \d.*)?$/i, 'PHP'],
  [/^mysql( \d.*)?$/i, 'MySQL'],
  [/^typescript/i, 'TypeScript'],
];

function fold(name: string): string {
  const trimmed = name.trim();
  for (const [pattern, family] of FAMILIES) if (pattern.test(trimmed)) return family;
  return trimmed;
}

export type StackRow = { name: string; count: number; projects: string[] };

export function stackIndex(projects: PublicProject[], limit = 12): StackRow[] {
  const rows = new Map<string, Set<string>>();
  for (const project of projects) {
    const names = project.technologies.flatMap((tech) => tech.split(/\s\+\s|,\s*/)).map(fold);
    for (const name of new Set(names)) {
      if (!name || /^internal$/i.test(name)) continue;
      if (!rows.has(name)) rows.set(name, new Set());
      rows.get(name)!.add(project.title);
    }
  }
  return [...rows.entries()]
    .map(([name, set]) => ({ name, count: set.size, projects: [...set] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}
