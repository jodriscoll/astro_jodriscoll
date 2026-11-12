import { timingSafeEqual } from 'node:crypto';
import { currentYearMonth, durationMonths, formatDuration, formatOpenRange, formatRange } from './dates';
import type { ProjectSource, PublicPost, PublicProfile, PublicProject, PublicRole, RoleSource } from './types';

export function publishProject(source: ProjectSource): PublicProject {
  const project: PublicProject = {
    slug: source.slug,
    title: source.title,
    summary: source.summary,
    featured: source.featured,
    technologies: [...source.technologies],
    links: {
      demo: source.links.demo,
      source: source.links.source,
    },
    images: [],
  };
  if (source.availability) project.availability = source.availability;
  return project;
}

export function publishRole(source: RoleSource): PublicRole {
  const undated = source.start == null;
  const endForMath = undated ? null : (source.end ?? currentYearMonth());
  const months = undated || endForMath == null ? 0 : durationMonths(source.start as string, endForMath);
  return {
    id: source.id,
    org: source.org,
    title: source.title,
    start: source.start,
    end: source.end,
    displayDate: undated ? 'Present' : source.end ? formatRange(source.start as string, source.end) : formatOpenRange(source.start as string),
    duration: months > 0 ? formatDuration(months) : '',
    months,
    employment: source.employment,
    ...(source.startedAs && !undated
      ? { startedAs: { ...source.startedAs, months: Math.min(months, durationMonths(source.start as string, source.startedAs.until)) } }
      : {}),
    relation: source.relation ?? '',
    location: source.location,
    bullets: [...source.bullets],
    leader: source.leader,
    parent: source.parent ?? '',
  };
}

export function publishProfile(profile: PublicProfile): PublicProfile {
  return {
    name: profile.name,
    role: profile.role,
    headline: profile.headline,
    summary: profile.summary,
    about: [...profile.about],
    services: profile.services.map((service) => ({ ...service })),
    skills: [...profile.skills],
    // The address stays private: every contact goes through the form.
    email: '',
    links: { github: profile.links.github, linkedin: profile.links.linkedin },
    contact: { ...profile.contact },
  };
}

export function publishPost(post: PublicPost, includeBody: boolean): PublicPost {
  const record: PublicPost = {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
  };
  if (includeBody) record.body = post.body ?? '';
  return record;
}

export function draftsAllowed(token: string | null): boolean {
  const expected = process.env.CONTENT_TOKEN;
  if (!expected || !token) return false;
  const provided = Buffer.from(token);
  const secret = Buffer.from(expected);
  if (provided.length !== secret.length) return false;
  return timingSafeEqual(provided, secret);
}
