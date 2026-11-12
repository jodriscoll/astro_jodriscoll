/**
 * The /resume view model. Joins the public record (gateway) with the
 * editorial layer (content/resume.json) and the figures already on the site.
 * The page renders this and nothing else, so another front end (or an agent
 * reading /api) can produce the same resume from the same shape.
 * Structured data (JSON-LD, /resume.json) is owned by src/agent, not here.
 */
import editorialRaw from '../../content/resume.json';
import educationRaw from '../../content/education.json';
import record from '../../content/record.json';
import { getResume, listProjects } from '../gateway';
import { currentYearMonth, durationMonths, formatDuration } from '../gateway/dates';
import type { PublicRole } from '../gateway';
import { publicRepositoryCount } from './activity';
import { PRIVATE_TOTAL, PUBLIC_TOTAL } from './contributions';

export type Metric = { value: string; label: string; note?: string; tone?: 'default' | 'accent' | 'positive' };
export type WorkLink = { slug: string; title: string; href: string; short: string };
export type SpecLite = {
  slug: string;
  short?: string;
  dek?: string;
  kind?: string;
  org?: string;
  stack?: { items: { name: string }[] }[];
  facts?: { label: string; value: string }[];
  highlights?: { title: string; text: string }[];
  delivery?: { summary: string; steps: { name: string; detail: string; figure?: string }[] };
  showcase?: { steps: { name: string; detail: string; figure?: string }[]; facts?: string[] };
};

/** One project given a showcase inside its employer's block (resume.json groups.*.feature). */
export type FeatureView = {
  slug: string;
  title: string;
  href: string;
  kind: string;
  dek: string;
  summary: string;
  steps: { name: string; detail: string; figure?: string }[];
  facts: { label: string; value: string }[];
  extras: string[];
  stack: string[];
};

export type RoleView = {
  id: string;
  org: string;
  orgName: string;
  llc: boolean;
  /** " LLC" or a domain ending like ".nyc", shown in grey after the name. */
  suffix: string;
  title: string;
  via: string;
  kind: string;
  location: string;
  start: string | null;
  end: string | null;
  when: string;
  duration: string;
  months: number;
  current: boolean;
  summary: string;
  metrics: Metric[];
  stack: string[];
  work: WorkLink[];
  bullets: string[];
};

export type GroupView = RoleView & {
  /** Side-practice start ("2016") and its explanation, when the practice predates full focus. */
  sideYear: string;
  sideNote: string;
  /** Own projects built between contracts, listed apart from client work. */
  between: WorkLink[];
  feature: FeatureView | null;
  children: RoleView[];
  childLayout: 'cards' | 'list' | 'properties';
};

export type TimelineRow = {
  id: string;
  label: string;
  start: string;
  end: string;
  current: boolean;
  depth: 0 | 1;
  duration: string;
  kind: 'role' | 'education';
  /** A short qualifier shown beside the label: "Internship", "A.A.S.". */
  tag?: string;
  /** YYYY-MM the role ran on the side before `start`; drawn as a lead-in, not a bar. */
  side?: string;
  sideNote?: string;
  /** YYYY-MM the role ran under `phaseKind` (an internship) before becoming its own type. */
  phaseUntil?: string;
  phaseKind?: string;
  /** Kinds of role, space-separated (Full-Time, Contractor, Internship, Leader), matching stats.employment ids. */
  mix?: string;
};

export type EducationView = {
  id: string;
  institution: string;
  studyType: string;
  credential: string;
  area: string;
  start: string;
  end: string;
  when: string;
  score: string;
  honors: string;
  honorTerms: string[];
  summary: string;
  hiredWhileEnrolled: string[];
};

type Entry = { summary?: string; metrics?: (Metric & { source?: string })[]; stack?: string[]; work?: string[] };
type Editorial = {
  positioning: string;
  title: string;
  titles: string[];
  recentSince: string;
  /** Projects to list first wherever an employer's work is shown. */
  highlightWork?: string[];
  groups: Record<
    string,
    Entry & {
      childLayout?: 'cards' | 'list' | 'properties';
      between?: string[];
      feature?: string;
      /** YYYY-MM the practice first ran on the side, before full focus. */
      sideSince?: string;
      sideNote?: string;
    }
  >;
  engagements: Record<string, Entry>;
  roles: Record<string, string>;
  skillGroups: { label: string; items: string[] }[];
  aiTools: string[];
};

const editorial = editorialRaw as unknown as Editorial;

function ym(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month - 1;
}

// Legal and domain suffixes ("Rehab LLC", "PDA.nyc") render in a quieter grey.
function splitLlc(org: string): { name: string; llc: boolean; suffix: string } {
  if (org.endsWith(' LLC')) return { name: org.slice(0, -4), llc: true, suffix: ' LLC' };
  const domain = org.match(/^(.+?)(\.nyc)$/);
  if (domain) return { name: domain[1], llc: false, suffix: domain[2] };
  return { name: org, llc: false, suffix: '' };
}

function shortWhen(role: PublicRole): string {
  if (!role.start) return 'Undated';
  const fmt = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} ${year}`;
  };
  return `${fmt(role.start)} – ${role.end ? fmt(role.end) : 'Present'}`;
}

export async function buildResume(specList: SpecLite[] = []) {
  const { profile, roles, stats } = getResume();
  const projects = listProjects();
  const specs = new Map(specList.map((spec) => [spec.slug, spec]));
  const byId = new Map(roles.map((role) => [role.id, role]));
  const now = currentYearMonth();

  // A work entry is a project slug (links to its case study), or, for work with no
  // page here, a plain name ("ZUGU") or "Name|https://url" (links out).
  function workLinks(slugs: string[] = []): WorkLink[] {
    return slugs.flatMap((slug) => {
      const project = projects.find((item) => item.slug === slug);
      if (project) return [{ slug, title: project.title, href: `/things-built/${slug}`, short: specs.get(slug)?.short ?? project.summary }];
      const [title, href = ''] = slug.split('|').map((part) => part.trim());
      return title ? [{ slug: '', title, href, short: '' }] : [];
    });
  }

  function featureFor(slug?: string): FeatureView | null {
    if (!slug) return null;
    const project = projects.find((item) => item.slug === slug);
    const spec = specs.get(slug);
    // A spec's own showcase wins; otherwise fall back to its delivery steps.
    const steps = spec?.showcase?.steps ?? spec?.delivery?.steps;
    if (!project || !spec || !steps) return null;
    const picked = spec.showcase?.facts;
    const facts = picked
      ? picked.flatMap((label) => (spec.facts ?? []).filter((fact) => fact.label === label))
      : spec.facts ?? [];
    return {
      slug,
      title: project.title,
      href: `/things-built/${slug}`,
      kind: spec.kind ?? '',
      dek: spec.dek ?? project.summary,
      summary: spec.delivery?.summary ?? '',
      steps,
      facts,
      extras: (spec.highlights ?? []).map((item) => item.title),
      stack: [...new Set((spec.stack ?? []).flatMap((group) => group.items.map((item) => item.name)))],
    };
  }

  function view(role: PublicRole, entry: Entry = {}, fallback = ''): RoleView {
    const { name, llc, suffix } = splitLlc(role.org || role.title);
    const parent = role.parent ? byId.get(role.parent) : undefined;
    const grandparent = parent?.parent ? byId.get(parent.parent) : undefined;
    return {
      id: role.id,
      org: role.org || role.title,
      orgName: name,
      llc,
      suffix,
      title: role.title === role.org ? '' : role.title,
      via: grandparent && parent ? `via ${splitLlc(parent.org).name}` : '',
      kind: role.relation || role.employment || '',
      location: role.location,
      start: role.start,
      end: role.end,
      when: shortWhen(role),
      duration: role.duration,
      months: role.months,
      current: role.start !== null && role.end === null,
      summary: entry.summary ?? fallback,
      metrics: (entry.metrics ?? []).map(({ value, label, tone }) => ({ value, label, tone })),
      stack: entry.stack ?? [],
      work: workLinks(entry.work),
      bullets: role.bullets,
    };
  }

  function descendants(id: string): PublicRole[] {
    return roles.filter((role) => role.parent === id).flatMap((role) => [role, ...descendants(role.id)]);
  }

  // Open contracts first, then the ones with figures, then newest.
  const byWeight = (a: RoleView, b: RoleView) => {
    if (!a.start !== !b.start) return a.start ? -1 : 1;
    return (
      Number(b.current) - Number(a.current) ||
      b.metrics.length - a.metrics.length ||
      (b.start && a.start ? ym(b.start) - ym(a.start) : 0)
    );
  };

  const education: EducationView[] = (educationRaw as Omit<EducationView, 'when'>[]).map((item) => ({
    ...item,
    when: item.start === item.end ? item.start : `${item.start} – ${item.end}`,
  }));

  const cutoff = ym(editorial.recentSince);
  const topLevel = roles.filter((role) => !role.parent);
  const isRecent = (role: PublicRole) => role.end === null || ym(role.end) >= cutoff;

  const groups: GroupView[] = topLevel.filter(isRecent).map((role) => {
    const entry = editorial.groups[role.id] ?? {};
    return {
      ...view(role, entry, role.bullets.join(' ')),
      childLayout: entry.childLayout ?? 'cards',
      sideYear: entry.sideSince?.slice(0, 4) ?? '',
      sideNote: entry.sideNote ?? '',
      between: workLinks(entry.between),
      feature: featureFor(entry.feature),
      // Only direct clients get a card. A client's own clients (ZUGU came
      // through PDA.nyc) fold into that card's record instead of posing as ours.
      children: roles
        .filter((child) => child.parent === role.id)
        .map((child) => {
          const nested = descendants(child.id);
          const entry = editorial.engagements[child.id] ?? {};
          const nestedStack = nested.flatMap((sub) => editorial.engagements[sub.id]?.stack ?? []);
          const merged: PublicRole = {
            ...child,
            bullets: [...child.bullets, ...nested.flatMap((sub) => sub.bullets.map((bullet) => `${splitLlc(sub.org || sub.title).name}: ${bullet}`))],
          };
          return view(
            merged,
            { ...entry, stack: [...new Set([...(entry.stack ?? []), ...nestedStack])] },
            editorial.roles[child.id] ?? child.bullets.join(' '),
          );
        })
        .sort(byWeight),
    };
  });

  // An earlier employer's work is every project whose spec names it (spec.org),
  // highlighted ones first, then the order of projects.json.
  const highlight = editorial.highlightWork ?? [];
  const rank = (slug: string) => {
    const at = highlight.indexOf(slug);
    return at === -1 ? highlight.length : at;
  };
  function workFor(roleId: string): string[] {
    return projects
      .filter((project) => specs.get(project.slug)?.org === roleId)
      .map((project) => project.slug)
      .sort((a, b) => rank(a) - rank(b));
  }

  const earlier: RoleView[] = topLevel
    .filter((role) => !isRecent(role))
    .map((role) => view(role, { work: workFor(role.id) }, editorial.roles[role.id] ?? role.bullets[0] ?? ''));

  // Engagement counts drawn from the record, not typed in.
  const nomadic = groups.find((group) => group.id === 'nomadic-digital');
  const openContracts = nomadic ? nomadic.children.filter((child) => child.current).length : 0;
  const clientsSince = groups.reduce((sum, group) => sum + Math.max(group.children.length, 1), 0);

  const glance: Metric[] = [
    { value: `${stats.spanYears}`, label: `Years, ${stats.startYear}–${stats.endYear}` },
    { value: `${openContracts}`, label: 'Open Relationships', tone: 'positive' },
    { value: `${clientsSince}`, label: `Clients Since ${editorial.recentSince.slice(0, 4)}` },
    { value: '50+', label: 'Sites Launched' },
    // Joey O'Driscoll, stated Nov 11 2026.
    { value: '250+', label: 'Client Repositories on File' },
    { value: record.collaborations, label: 'Collaborations' },
    { value: record.countries, label: 'Global Clients' },
  ];

  // A role with no employment type takes its parent's (MentalHealth.com inside
  // Rehab LLC); a practice with none is consulting when its clients are contracts.
  function kindOf(role: PublicRole): string | null {
    if (role.employment) return role.employment;
    const parent = role.parent ? byId.get(role.parent) : undefined;
    if (parent) return kindOf(parent);
    return roles.some((child) => child.parent === role.id && child.employment === 'Contractor') ? 'Contractor' : null;
  }

  const roleRows: TimelineRow[] = topLevel
    .filter((role) => role.start)
    .flatMap((role) => [
      { role, depth: 0 as const },
      // Engagements inside an employer read oldest first (by start, then end),
      // so they step down the chart like a Gantt: the Mindgrub contract (2022)
      // sits above the 2023 agency work.
      ...roles
        .filter((child) => child.parent === role.id && child.start)
        .sort((a, b) => (a.start as string).localeCompare(b.start as string) || (a.end ?? '9999').localeCompare(b.end ?? '9999'))
        .map((child) => ({ role: child, depth: 1 as const })),
    ])
    .map(({ role, depth }) => ({
      id: role.id,
      // Full legal names here (Nomadic Digital LLC, Rehab LLC): this is the record view.
      label: role.org || role.title,
      start: role.start as string,
      end: role.end ?? now,
      current: role.end === null,
      depth,
      duration: role.duration,
      kind: 'role' as const,
      tag: role.employment === 'Internship' ? 'Intern' : undefined,
      phaseUntil: role.startedAs?.until,
      phaseKind: role.startedAs?.employment,
      mix: [role.startedAs?.employment, kindOf(role), role.leader ? 'Leader' : null].filter(Boolean).join(' '),
    }));

  // An employer's bar covers every engagement held inside it, so a child never
  // runs past its parent on the chart. The role's own dates stay as recorded.
  for (const row of roleRows) {
    if (row.depth !== 0) continue;
    const kids = roleRows.filter((child) => child.depth === 1 && roles.find((r) => r.id === child.id)?.parent === row.id);
    if (!kids.length) continue;
    const start = kids.reduce((min, kid) => (ym(kid.start) < ym(min) ? kid.start : min), row.start);
    const end = kids.reduce((max, kid) => (ym(kid.end) > ym(max) ? kid.end : max), row.end);
    if (start === row.start && end === row.end) continue;
    row.start = start;
    row.end = end;
    row.current = row.current || kids.some((kid) => kid.current);
    row.duration = formatDuration(durationMonths(start, end));
  }

  // A practice that ran on the side before full focus gets a lead-in from that date.
  for (const row of roleRows) {
    const entry = row.depth === 0 ? editorial.groups[row.id] : undefined;
    if (entry?.sideSince && ym(entry.sideSince) < ym(row.start)) {
      row.side = entry.sideSince;
      row.sideNote = entry.sideNote;
    }
  }

  // Education carries years only, so its bar spans whole years (Jan to Dec).
  const educationRows: TimelineRow[] = education.map((item) => ({
    id: item.id,
    label: item.institution,
    start: `${item.start}-01`,
    end: `${item.end}-12`,
    current: false,
    depth: 0,
    duration: item.when,
    kind: 'education',
    tag: item.credential,
  }));

  // Slot each education row in before the first top-level role that started earlier.
  const timeline: TimelineRow[] = [...roleRows];
  for (const row of educationRows) {
    const at = timeline.findIndex((item) => item.depth === 0 && ym(item.start) < ym(row.start));
    timeline.splice(at === -1 ? timeline.length : at, 0, row);
  }

  const covered = new Set(editorial.skillGroups.flatMap((group) => group.items));
  const rest = profile.skills.filter((skill) => !covered.has(skill));
  const skillGroups = rest.length ? [...editorial.skillGroups, { label: 'Also', items: rest }] : editorial.skillGroups;

  const selected = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    href: `/things-built/${project.slug}`,
    short: specs.get(project.slug)?.short ?? project.summary,
    kind: specs.get(project.slug)?.kind ?? '',
    stack: [...new Set([...project.technologies, ...(specs.get(project.slug)?.stack ?? []).flatMap((group) => group.items.map((item) => item.name))])],
    featured: project.featured,
  }))
    // Featured first, then highlighted work, then the order of projects.json (stable sort).
    .sort((a, b) => Number(b.featured) - Number(a.featured) || rank(a.slug) - rank(b.slug));

  const contributions = {
    public: PUBLIC_TOTAL,
    private: PRIVATE_TOTAL,
    repositories: publicRepositoryCount,
  };

  return {
    profile,
    positioning: editorial.positioning,
    title: editorial.title,
    titles: editorial.titles,
    recentSince: editorial.recentSince,
    aiTools: editorial.aiTools,
    stats,
    glance,
    groups,
    earlier,
    education,
    timeline,
    timelineStart: timeline.reduce((min, row) => (ym(row.start) < ym(min) ? row.start : min), now),
    now,
    skillGroups,
    selected,
    contributions,
  };
}

export type ResumeView = Awaited<ReturnType<typeof buildResume>>;
