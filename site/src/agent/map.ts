// Pure mapping from this site's public records to the portable Bundle. No
// Astro imports, so it runs (and is tested) outside a build.

import agentRaw from '../../content/agent.json';
import weaknessesRaw from '../../content/weaknesses.json';
import type { PublicProfile, PublicProject, Resume } from '../gateway';
import { formatIsoDate } from '../gateway/dates';
import { stackIndex } from '../lib/stackindex';
import type { Bundle, EssayInput, OutcomeInput, PageInput, PostInput, WorkInput } from './types';

type AgentConfig = {
  language: string;
  siteName: string;
  siteDescription: string;
  handle?: string;
  image?: string;
  imageAlt?: string;
  location?: { locality?: string; region?: string; country?: string; remote?: boolean };
  contact?: { label: string; url: string };
};

export type Essay = EssayInput & { kicker: string };

/** The fields of a content/specs entry the agent layer reads. */
export type SpecLike = {
  slug: string;
  org?: string;
  kind: string;
  role?: string;
  period?: { start: string; end: string | null };
  dek: string;
  short?: string;
  facts: { label: string; value: string }[];
  stack: { group: string; items: { name: string }[] }[];
  delivery?: { built: boolean; summary: string; steps: { name: string; detail: string }[] };
  highlights: { title: string; text: string }[];
  outcomes?: OutcomeInput[];
  images: { src: string; alt: string }[];
};

export type PostLike = {
  id: string;
  body?: string;
  data: { title: string; description: string; date: Date; tags?: string[] };
};

const agent = agentRaw as AgentConfig;
export const weaknesses = weaknessesRaw as Essay;

const usernameOf = (url: string) => url.replace(/\/+$/, '').split('/').pop() ?? '';

export function toBundle(input: {
  origin: string;
  profile: PublicProfile;
  resume: Resume;
  projects: PublicProject[];
  specs: Map<string, SpecLike>;
  entries: PostLike[];
}): Bundle {
  const { origin, profile, resume, projects, specs, entries } = input;

  const works: WorkInput[] = projects.map((project) => {
    const spec = specs.get(project.slug);
    const stack = spec?.stack.flatMap((group) => group.items.map((item) => item.name)) ?? [];
    return {
      slug: project.slug,
      url: `${origin}/things-built/${project.slug}`,
      title: project.title,
      summary: spec?.short ?? project.summary,
      dek: spec?.dek,
      kind: spec?.kind,
      role: spec?.role,
      org: spec?.org,
      period: spec?.period,
      technologies: [...new Set([...project.technologies, ...stack])],
      demo: project.links.demo,
      source: project.links.source,
      images: spec?.images.map((image) => ({ src: image.src, alt: image.alt })) ?? [],
      facts: spec?.facts ?? [],
      highlights: spec?.highlights ?? [],
      outcomes: spec?.outcomes ?? [],
      delivery: spec?.delivery,
      featured: project.featured,
    };
  });

  const posts: PostInput[] = entries.map((entry) => ({
    slug: entry.id,
    url: `${origin}/blog/${entry.id}`,
    title: entry.data.title,
    description: entry.data.description,
    date: formatIsoDate(entry.data.date),
    tags: entry.data.tags ?? [],
    body: entry.body,
  }));

  const pages: PageInput[] = [
    { path: '/', title: 'Home', description: `${profile.headline} Selected work, stack index, services and current engagements.` },
    { path: '/resume', title: 'Resume', description: 'Every role with dates, the employment mix, platforms and things built. Printable.' },
    { path: '/things-built', title: 'Work', description: `All ${projects.length} public projects, what each is built on, and who it was built with.` },
    { path: '/blog', title: 'Writing', description: 'Engineering notes: what broke, what was measured, what changed.' },
    { path: '/technologies', title: 'Stacks', description: 'One canonical content record, translated into the shape each front-end framework expects.' },
    { path: weaknesses.path, title: weaknesses.title, description: `A written self-assessment. ${weaknesses.description}` },
  ];

  return {
    site: { origin, name: agent.siteName, language: agent.language, description: agent.siteDescription },
    person: {
      name: profile.name,
      jobTitle: profile.role,
      headline: profile.headline,
      summary: profile.summary,
      about: profile.about,
      image: agent.image,
      imageAlt: agent.imageAlt,
      handle: agent.handle,
      sameAs: [profile.links.github, profile.links.linkedin],
      profiles: [
        { network: 'GitHub', url: profile.links.github, username: usernameOf(profile.links.github) },
        { network: 'LinkedIn', url: profile.links.linkedin, username: usernameOf(profile.links.linkedin) },
      ],
      skills: profile.skills,
      services: profile.services.map((service) => ({ name: service.title, description: service.text })),
      location: agent.location,
      contact: agent.contact,
    },
    roles: resume.roles.map((role) => ({
      id: role.id,
      org: role.org,
      title: role.title,
      start: role.start,
      end: role.end,
      location: role.location,
      employment: role.relation || role.employment || undefined,
      bullets: role.bullets,
      parent: role.parent || undefined,
    })),
    works,
    posts,
    pages,
    essays: [weaknesses],
    stats: {
      startYear: resume.stats.startYear,
      endYear: resume.stats.endYear,
      roleCount: resume.stats.roleCount,
      projectCount: resume.stats.projectCount,
    },
    stack: stackIndex(projects, 12).map((row) => ({ name: row.name, count: row.count })),
    machine: [
      { path: '/llms-full.txt', title: 'Full public record', description: 'Profile, every role, every project, the weaknesses page and all posts', type: 'text/plain' },
      { path: '/resume.json', title: 'Resume', description: 'JSON Resume v1', type: 'application/json' },
      { path: '/api/content/resume', title: 'Content API: resume', description: 'Canonical profile, roles, projects and stats', type: 'application/json' },
      { path: '/api/content', title: 'Content API', description: 'Everything public; add ?stack=react|vue|angular|wordpress|drupal for framework-shaped records', type: 'application/json' },
      { path: '/sitemap.xml', title: 'Sitemap', description: 'Every public page', type: 'application/xml' },
      { path: '/rss.xml', title: 'RSS', description: 'Writing feed', type: 'application/rss+xml' },
    ],
  };
}

