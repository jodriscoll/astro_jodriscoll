import experienceRaw from '../../content/experience.json';
import profileRaw from '../../content/profile.json';
import projectsRaw from '../../content/projects.json';
import technologiesRaw from '../../content/technologies.json';
import { currentYearMonth, parseYearMonth } from './dates';
import { publishProfile, publishProject, publishRole } from './protect';
import type {
  Employment,
  HostStack,
  ProjectSource,
  PublicProfile,
  PublicProject,
  PublicRole,
  Resume,
  RoleSource,
  Service,
  Technology,
  TechnologyStatus,
  Visibility,
  Availability,
} from './types';
import { STACKS } from './types';

const EMPLOYMENT = ['Full-Time', 'Contractor', 'Internship'] as const;
const HOST_STACKS = STACKS.filter((stack): stack is HostStack => stack !== 'canonical');
const STATUSES = ['live', 'gateway'] as const;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(source: Record<string, unknown>, key: string, label: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is missing ${key}`);
  return value;
}

function textList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${label} must be a list of strings`);
  }
  return value;
}

function line(source: Record<string, unknown>, key: string, label: string, required = true): string {
  const value = source[key];
  if (value === undefined || value === null) {
    if (required) throw new Error(`${label} is missing ${key}`);
    return '';
  }
  if (typeof value !== 'string') throw new Error(`${label} ${key} must be a string`);
  if (required && value.trim() === '') throw new Error(`${label} is missing ${key}`);
  return value;
}

function yearMonthOrNull(source: Record<string, unknown>, key: string, label: string): string | null {
  const value = source[key];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${label} ${key} must be YYYY-MM`);
  parseYearMonth(value, `${label} ${key}`);
  return value;
}

function servicesOf(value: unknown): Service[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('profile services must be a list');
  return value.map((item, index) => {
    const source = record(item, `service ${index}`);
    return {
      title: text(source, 'title', `service ${index}`),
      text: text(source, 'text', `service ${index}`),
    };
  });
}

function visibilityOf(source: Record<string, unknown>, label: string): Visibility {
  if (source.visibility === undefined) return 'public';
  if (source.visibility === 'public' || source.visibility === 'draft') return source.visibility;
  throw new Error(`${label} has an unknown visibility`);
}

function linksOf(value: unknown, label: string): ProjectSource['links'] {
  const source = record(value ?? {}, `${label} links`);
  const demo = source.demo;
  const code = source.source;
  if (demo !== undefined && typeof demo !== 'string') throw new Error(`${label} demo must be a string`);
  if (code !== undefined && typeof code !== 'string') throw new Error(`${label} source must be a string`);
  return {
    demo: typeof demo === 'string' ? demo : undefined,
    source: typeof code === 'string' ? code : undefined,
  };
}

function availabilityOf(source: Record<string, unknown>, label: string): Availability | undefined {
  const value = source.availability;
  if (value === undefined) return undefined;
  if (value === 'online' || value === 'offline') return value;
  throw new Error(`${label} has an unknown availability`);
}

function internalOf(value: unknown): { notes?: string } | undefined {
  if (value === undefined) return undefined;
  const source = record(value, 'internal');
  if (source.notes !== undefined && typeof source.notes !== 'string') {
    throw new Error('internal notes must be a string');
  }
  return { notes: typeof source.notes === 'string' ? source.notes : undefined };
}

function readProfile(value: unknown): PublicProfile {
  const source = record(value, 'profile');
  const links = record(source.links, 'profile links');
  const contact = record(source.contact, 'profile contact');
  return publishProfile({
    name: text(source, 'name', 'profile'),
    role: text(source, 'role', 'profile'),
    headline: text(source, 'headline', 'profile'),
    summary: text(source, 'summary', 'profile'),
    about: textList(source.about, 'profile about'),
    services: servicesOf(source.services),
    skills: textList(source.skills, 'profile skills'),
    email: text(source, 'email', 'profile'),
    links: {
      github: text(links, 'github', 'profile links'),
      linkedin: text(links, 'linkedin', 'profile links'),
    },
    contact: {
      title: text(contact, 'title', 'profile contact'),
      text: text(contact, 'text', 'profile contact'),
      action: text(contact, 'action', 'profile contact'),
    },
  });
}

function readProject(value: unknown, index: number): ProjectSource {
  const source = record(value, `project ${index}`);
  const label = `project ${index}`;
  return {
    slug: text(source, 'slug', label),
    title: text(source, 'title', label),
    summary: text(source, 'summary', label),
    featured: source.featured === true,
    technologies: textList(source.technologies, `${label} technologies`),
    links: linksOf(source.links, label),
    visibility: visibilityOf(source, label),
    availability: availabilityOf(source, label),
    internal: internalOf(source.internal),
  };
}

function employmentOf(value: unknown, label: string): Employment | null {
  if (value === undefined || value === null || value === '') return null;
  if (!(EMPLOYMENT as readonly string[]).includes(String(value))) {
    throw new Error(`${label} has an unknown employment type`);
  }
  return value as Employment;
}

function startedAsOf(value: unknown, label: string): RoleSource['startedAs'] {
  if (value === undefined || value === null) return undefined;
  const source = record(value, `${label} startedAs`);
  const employment = employmentOf(source.employment, `${label} startedAs`);
  const until = source.until;
  if (!employment || typeof until !== 'string' || !/^\d{4}-\d{2}$/.test(until)) {
    throw new Error(`${label} startedAs needs an employment type and an until YYYY-MM`);
  }
  return { employment, until };
}

function readRole(value: unknown, index: number): RoleSource {
  const source = record(value, `role ${index}`);
  const label = `role ${index}`;
  const relation = source.relation;
  if (relation !== undefined && typeof relation !== 'string') {
    throw new Error(`${label} relation must be a string`);
  }
  if (typeof source.leader !== 'boolean') throw new Error(`${label} leader must be a boolean`);
  const parent = source.parent;
  if (parent !== undefined && typeof parent !== 'string') throw new Error(`${label} parent must be a string`);
  return {
    id: text(source, 'id', label),
    org: line(source, 'org', label, false),
    title: text(source, 'title', label),
    start: yearMonthOrNull(source, 'start', label),
    end: yearMonthOrNull(source, 'end', label),
    employment: employmentOf(source.employment, label),
    startedAs: startedAsOf(source.startedAs, label),
    location: line(source, 'location', label, false),
    bullets: textList(source.bullets, `${label} bullets`),
    visibility: visibilityOf(source, label),
    relation: typeof relation === 'string' ? relation : '',
    leader: source.leader,
    parent: typeof parent === 'string' ? parent : '',
    internal: internalOf(source.internal),
  };
}

function readTechnology(value: unknown, index: number): Technology {
  const source = record(value, `technology ${index}`);
  const id = text(source, 'id', `technology ${index}`);
  const status = text(source, 'status', `technology ${index}`);
  if (!(HOST_STACKS as readonly string[]).includes(id)) throw new Error(`Unknown stack ${id}`);
  if (!(STATUSES as readonly string[]).includes(status)) throw new Error(`Unknown status ${status}`);
  return {
    id: id as HostStack,
    name: text(source, 'name', `technology ${index}`),
    host: text(source, 'host', `technology ${index}`),
    status: status as TechnologyStatus,
    summary: text(source, 'summary', `technology ${index}`),
  };
}

const profile = readProfile(profileRaw);
const projects = (projectsRaw as unknown[]).map(readProject);
const roles = (experienceRaw as unknown[]).map(readRole);

for (const role of roles) {
  if (!role.parent) continue;
  if (role.parent === role.id) throw new Error(`${role.id} cannot parent itself`);
  if (!roles.some((item) => item.id === role.parent)) {
    throw new Error(`${role.id} parent ${role.parent} is not a role`);
  }
}
const technologies = (technologiesRaw as unknown[]).map(readTechnology);

function isReleased(visibility: Visibility, includeDrafts: boolean): boolean {
  return visibility === 'public' || (includeDrafts && visibility === 'draft');
}

export function getProfile(): PublicProfile {
  return publishProfile(profile);
}

export function listProjects(includeDrafts = false): PublicProject[] {
  return projects.filter((project) => isReleased(project.visibility, includeDrafts)).map(publishProject);
}

export function getProject(slug: string): PublicProject | undefined {
  const project = projects.find((item) => item.slug === slug && item.visibility === 'public');
  return project ? publishProject(project) : undefined;
}

export function projectVisibility(slug: string, includeDrafts: boolean): PublicProject | undefined {
  const project = projects.find((item) => item.slug === slug && isReleased(item.visibility, includeDrafts));
  if (!project) return undefined;
  return publishProject(project);
}

export function isDraftProject(slug: string): boolean {
  return projects.some((project) => project.slug === slug && project.visibility === 'draft');
}

export function listRoles(): PublicRole[] {
  return roles.filter((role) => role.visibility === 'public').map(publishRole);
}

export function listTechnologies(): Technology[] {
  return technologies.map((item) => ({ ...item }));
}

export function neighbors(slug: string): {
  prev?: PublicProject;
  next?: PublicProject;
  index: number;
  total: number;
} {
  const published = listProjects();
  const index = published.findIndex((project) => project.slug === slug);
  return {
    prev: index > 0 ? published[index - 1] : undefined,
    next: index >= 0 && index < published.length - 1 ? published[index + 1] : undefined,
    index: index + 1,
    total: published.length,
  };
}

export function getResume(): Resume {
  const publishedRoles = listRoles();
  const publishedProjects = listProjects();
  const dated = publishedRoles.filter((role) => role.start && role.months > 0);
  const now = currentYearMonth();
  const startYear = Math.min(...dated.map((role) => Number((role.start as string).slice(0, 4))));
  const endYear = Math.max(...dated.map((role) => Number((role.end ?? now).slice(0, 4))));
  const longest = dated.reduce((best, role) => (role.months > best.months ? role : best));
  const shares = [
    { id: 'Full-Time' as const, label: 'Full-time', months: 0 },
    { id: 'Contractor' as const, label: 'Consultant', months: 0 },
    { id: 'Internship' as const, label: 'Intern', months: 0 },
    { id: 'Leader' as const, label: 'Leadership', months: 0 },
  ];
  const leader = shares.find((item) => item.id === 'Leader');
  for (const role of dated) {
    // A role that began as an internship counts those months as Intern, the rest as its own type.
    const early = role.startedAs;
    if (early) {
      const first = shares.find((item) => item.id === early.employment);
      if (first) first.months += early.months;
    }
    const share = shares.find((item) => item.id === role.employment);
    if (share) share.months += role.months - (early?.months ?? 0);
    if (role.leader && leader) leader.months += role.months;
  }

  return {
    profile: getProfile(),
    roles: publishedRoles,
    projects: publishedProjects,
    stats: {
      startYear,
      endYear,
      spanYears: endYear - startYear,
      roleCount: publishedRoles.length,
      projectCount: publishedProjects.length,
      longest: { org: longest.org, duration: longest.duration, months: longest.months },
      employment: shares.filter((item) => item.months > 0),
    },
  };
}
