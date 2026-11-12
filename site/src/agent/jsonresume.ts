import { absolute, compact } from './schema';
import type { Bundle } from './types';

// JSON Resume v1 (https://jsonresume.org/schema). It is the closest thing to a
// shared resume format: ATS importers, resume themes and agents read it
// without a site-specific parser. Email stays out on purpose when the site
// routes contact through a form.

export const JSON_RESUME_SCHEMA = 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json';

export function buildJsonResume(bundle: Bundle, lastModified = new Date()): Record<string, unknown> {
  const { site, person } = bundle;
  const org = (id?: string) => bundle.roles.find((role) => role.id === id)?.org;

  return {
    $schema: JSON_RESUME_SCHEMA,
    basics: compact({
      name: person.name,
      label: person.jobTitle,
      image: person.image ? absolute(site, person.image) : undefined,
      url: `${site.origin}/`,
      summary: person.summary,
      location: person.location
        ? compact({ city: person.location.locality, region: person.location.region, countryCode: person.location.country })
        : undefined,
      profiles: person.profiles.map((profile) => compact({ ...profile })),
    }),
    work: bundle.roles.map((role) => {
      const parent = role.parent ? org(role.parent) : undefined;
      return compact({
        name: role.org || role.title,
        position: role.title,
        location: role.location,
        startDate: role.start ?? undefined,
        endDate: role.end ?? undefined,
        summary: [role.employment, parent ? `Held under ${parent}` : ''].filter(Boolean).join('. ') || undefined,
        highlights: role.bullets,
      });
    }),
    projects: bundle.works.map((work) =>
      compact({
        name: work.title,
        description: work.summary,
        url: work.demo ?? work.url,
        startDate: work.period?.start,
        endDate: work.period?.end ?? undefined,
        entity: org(work.org),
        type: work.kind,
        roles: work.role ? [work.role] : undefined,
        keywords: work.technologies,
        highlights: [
          ...work.outcomes.map((outcome) => `${outcome.metric}: ${outcome.value}`),
          ...work.highlights.map((note) => note.title),
        ],
      }),
    ),
    skills: [
      { name: 'Core', keywords: person.skills },
      ...(bundle.stack.length
        ? [{ name: 'Platforms in shipped work', keywords: bundle.stack.map((row) => row.name) }]
        : []),
    ],
    meta: {
      canonical: absolute(site, '/resume.json'),
      version: 'v1.0.0',
      lastModified: lastModified.toISOString(),
    },
  };
}
