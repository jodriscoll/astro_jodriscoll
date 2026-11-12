export type Accent = 'amber' | 'green' | 'teal' | 'gold' | 'blue';

export type Depth = 'Confident' | 'Comfortable';

export type Facet = {
  id: string;
  label: string;
  text: string;
  depth: Depth;
  fill: number;
  accent: Accent;
};

/**
 * Depth is a reading of site/content/source-index.json plus the roles.
 * Trees, excluding training: JavaScript 139, CSS 139, PHP 111, WordPress 86,
 * Drupal 9 (six manifests plus three Drupal 7 trees named in Engineering/Projects/Drupal).
 * Ruby as a product is takgov-core only. Gateshosting is Capistrano, not a second app.
 * Python products beyond the confirmed CogoLabs automation and the Rehab
 * backend/lambda archives did not show up. Script-only files were left out.
 * JavaScript and WordPress stay deep. Python and Ruby stay light.
 * Joey's own reading (Nov 10, 2026): Confident across the board, except
 * Python and Ruby, which are Comfortable. The bar length is still the
 * source-index reading above, not a self-rating.
 *
 * Practice facets added Nov 11, 2026 at Joey's request (Leadership through
 * Migrations): each text cites work already on the record; the bar is a
 * relative weight by how much of that record it covers, not a measurement.
 */
export const facets: Facet[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    text: 'Most of the career, and the front ends still shipping today: Vue, React, Angular and TypeScript.',
    depth: 'Confident',
    fill: 100,
    accent: 'gold',
  },
  {
    id: 'wordpress',
    label: 'WordPress',
    text: 'Themes and multisites: Sequoia, SageLife, and the current association sites.',
    depth: 'Confident',
    fill: 92,
    accent: 'teal',
  },
  {
    id: 'css',
    label: 'CSS',
    text: 'The interface itself. Sequoia was a long stretch of it.',
    depth: 'Confident',
    fill: 78,
    accent: 'amber',
  },
  {
    id: 'php',
    label: 'PHP',
    text: 'The layer under the WordPress and Drupal work.',
    depth: 'Confident',
    fill: 64,
    accent: 'amber',
  },
  {
    id: 'drupal',
    label: 'Drupal',
    text: 'OCAD now, and a run of Drupal builds before that.',
    depth: 'Confident',
    fill: 44,
    accent: 'teal',
  },
  {
    id: 'leadership',
    label: 'Leadership',
    text: 'Director of web operations at Rehab LLC through its sale, web engineering lead at millermedia7, UI architect lead on PepsiCo Pepviz, and mentoring developers at every level.',
    depth: 'Confident',
    fill: 38,
    accent: 'gold',
  },
  {
    id: 'performance',
    label: 'Performance Diagnosis',
    text: 'Core Web Vitals audits at Mindgrub and Rehab.com; GameKal home load cut from about 20 s to 1.81 s and title search from 19.6 ms to 1.1 ms.',
    depth: 'Confident',
    fill: 36,
    accent: 'amber',
  },
  {
    id: 'ci-cd',
    label: 'CI/CD and Release Engineering',
    text: 'GitHub Actions and Cloudflare Pages at Rehab, GitLab CI at Mindgrub, and Vercel and EAS release pipelines for GameKal.',
    depth: 'Confident',
    fill: 34,
    accent: 'blue',
  },
  {
    id: 'client-services',
    label: 'Client Services',
    text: 'The consulting chapter under Nomadic. The current clients sit in one practice.',
    depth: 'Confident',
    fill: 40,
    accent: 'gold',
  },
  {
    id: 'testing',
    label: 'Testing and QA',
    text: 'Checking the work before it ships, in the practice and on Rehab.',
    depth: 'Confident',
    fill: 34,
    accent: 'green',
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting and Diagnostics',
    text: 'Production triage across 21 WordPress sites on four hosts at Taoti, and day-to-day incident work across the Rehab apps.',
    depth: 'Confident',
    fill: 32,
    accent: 'green',
  },
  {
    id: 'security',
    label: 'Security Hardening',
    text: 'One security baseline across the Taoti WordPress portfolio (2FA, SSO, application-password removal), and a single point of failure removed at Rehab.',
    depth: 'Confident',
    fill: 30,
    accent: 'green',
  },
  {
    id: 'seo',
    label: 'Technical SEO',
    text: 'Core Web Vitals for organic ranking at Rehab.com, SEOmatic on ZEFR, and a 100 Lighthouse SEO score on GameKal.',
    depth: 'Confident',
    fill: 30,
    accent: 'teal',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    text: 'ADA, 508, and WAI-ARIA, held as part of the build.',
    depth: 'Confident',
    fill: 30,
    accent: 'green',
  },
  {
    id: 'cloud',
    label: 'Cloud Infrastructure',
    text: 'AWS Amplify, Lambda, Cognito and GraphQL behind the Rehab admin platform, with monthly AWS spend more than halved.',
    depth: 'Confident',
    fill: 28,
    accent: 'amber',
  },
  {
    id: 'migrations',
    label: 'Platform Migrations',
    text: 'ZEFR onto Craft CMS 5 and Craft Cloud, Rehab deploys onto Cloudflare Pages, and CD-based training moved to the web at Aptima.',
    depth: 'Confident',
    fill: 26,
    accent: 'teal',
  },
  {
    id: 'reverse-engineering',
    label: 'Reverse Engineering',
    text: 'Fisher of Fire: an encrypted PSP program decrypted, 11,676 functions decompiled to C with Ghidra, and the game logic traced and rebuilt in TypeScript.',
    depth: 'Confident',
    fill: 24,
    accent: 'gold',
  },
  {
    id: 'mobile',
    label: 'Mobile App Development',
    text: 'GameKal on iOS, Android and the web from one Expo codebase, and the Mindgrub PWAs before it.',
    depth: 'Confident',
    fill: 28,
    accent: 'blue',
  },
  {
    id: 'ux-planning',
    label: 'UX Planning',
    text: 'Interface judgment: what the screen is for, and whether the structure holds.',
    depth: 'Confident',
    fill: 22,
    accent: 'teal',
  },
  {
    id: 'cpu-threads',
    label: 'CPU and Thread Analysis',
    text: 'Profiling main-thread load and long tasks behind Core Web Vitals, and moving GameKal animation onto the UI thread with Reanimated.',
    depth: 'Confident',
    fill: 20,
    accent: 'blue',
  },
  {
    id: 'design-review',
    label: 'Design Review',
    text: 'Design and implementation for incaseofdeath, through branding and go-live.',
    depth: 'Confident',
    fill: 18,
    accent: 'amber',
  },
  {
    id: 'python',
    label: 'Python',
    text: 'A smaller tool. Email distribution at CogoLabs, and the Rehab sale data.',
    depth: 'Comfortable',
    fill: 16,
    accent: 'green',
  },
  {
    id: 'atlassian',
    label: 'Atlassian Suite',
    text: 'Jira and Confluence as the working system for planning, tracking and documenting client delivery.',
    depth: 'Confident',
    fill: 14,
    accent: 'blue',
  },
  {
    id: 'ruby',
    label: 'Ruby',
    text: 'TAK.gov. A compact app beside the front end.',
    depth: 'Comfortable',
    fill: 12,
    accent: 'blue',
  },
];

const extra: Record<string, { label: string; accent: Accent }> = {
  webflow: { label: 'Webflow', accent: 'blue' },
  craft: { label: 'Craft', accent: 'gold' },
  shopify: { label: 'Shopify', accent: 'green' },
  vue: { label: 'Vue', accent: 'teal' },
  aws: { label: 'AWS', accent: 'amber' },
};

const roleFacets: Record<string, string[]> = {
  'nomadic-digital': ['client-services', 'mobile'],
  taoti: ['client-services', 'wordpress', 'drupal'],
  sageworx: ['client-services', 'wordpress'],
  millermedia7: ['client-services', 'wordpress', 'craft'],
  pda: ['client-services', 'webflow'],
  sauce: ['client-services', 'webflow'],
  ancient: ['client-services', 'javascript'],
  zugu: ['client-services', 'design-review', 'shopify'],
  'rehab-llc': ['python', 'vue', 'aws', 'wordpress'],
  'rehab-com-performance': ['vue', 'javascript'],
  mindgrub: ['javascript', 'wordpress', 'drupal', 'php', 'ruby', 'accessibility', 'testing', 'mobile'],
  jellyfish: ['javascript', 'wordpress', 'drupal', 'css'],
  'kor-group': ['javascript', 'css', 'ux-planning'],
  cogolabs: ['python'],
  'shawmut-construction': ['css', 'testing'],
  'mass-general-hospital': ['css', 'aws'],
  healthcaresource: ['javascript', 'php', 'css'],
  'earthbound-media-group': ['javascript', 'css'],
};

const byId = new Map(facets.map((facet) => [facet.id, facet]));

export const homeFacetIds = ['javascript', 'wordpress', 'css', 'php', 'drupal', 'client-services'];

export function facetsById(ids: string[]): Facet[] {
  return ids.flatMap((id) => {
    const facet = byId.get(id);
    return facet ? [facet] : [];
  });
}

export function facetsForRole(id: string): { id: string; label: string; accent: Accent }[] {
  return (roleFacets[id] ?? []).flatMap((facetId) => {
    const facet = byId.get(facetId);
    if (facet) return [{ id: facetId, label: facet.label, accent: facet.accent }];
    const more = extra[facetId];
    return more ? [{ id: facetId, label: more.label, accent: more.accent }] : [];
  });
}
