import type {
  Bundle,
  EssayInput,
  JsonLdNode,
  PersonInput,
  PostInput,
  RoleInput,
  SiteInput,
  WorkInput,
} from './types';

// JSON-LD builders. Every node gets a stable @id so pages reference one
// Person, one WebSite and one Organization per employer instead of repeating
// them. Parsers (search, LLM crawlers, ATS enrichment) resolve the references
// inside a single @graph.

export const ids = {
  website: (site: SiteInput) => `${site.origin}/#website`,
  person: (site: SiteInput) => `${site.origin}/#person`,
  org: (site: SiteInput, id: string) => `${site.origin}/#org-${id}`,
  page: (url: string) => `${url}#webpage`,
  work: (url: string) => `${url}#work`,
  post: (url: string) => `${url}#post`,
  breadcrumb: (url: string) => `${url}#breadcrumb`,
};

const ref = (id: string) => ({ '@id': id });

export function absolute(site: SiteInput, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Drops undefined, null, empty strings and empty arrays so the graph stays lean. */
export function compact<T extends JsonLdNode>(node: T): T {
  const out: JsonLdNode = {};
  for (const [key, value] of Object.entries(node)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out as T;
}

/** YYYY-MM stays YYYY-MM: ISO 8601 allows reduced precision, and inventing a day would be false precision. */
const isoMonth = (value: string | null | undefined) => value ?? undefined;

/** Current means dated and still open. An undated role makes no claim to be ongoing. */
export function isCurrent(role: RoleInput): boolean {
  return role.start !== null && role.end === null;
}

export function websiteNode(site: SiteInput): JsonLdNode {
  return compact({
    '@type': 'WebSite',
    '@id': ids.website(site),
    url: `${site.origin}/`,
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    author: ref(ids.person(site)),
    publisher: ref(ids.person(site)),
    copyrightHolder: ref(ids.person(site)),
  });
}

export function organizationNodes(site: SiteInput, roles: RoleInput[]): JsonLdNode[] {
  const seen = new Map<string, JsonLdNode>();
  for (const role of roles) {
    if (!role.org || seen.has(role.id)) continue;
    seen.set(role.id, { '@type': 'Organization', '@id': ids.org(site, role.id), name: role.org });
  }
  return [...seen.values()];
}

function roleRelation(site: SiteInput, role: RoleInput, property: 'worksFor' | 'alumniOf'): JsonLdNode {
  // schema.org Role pattern: the inner property repeats the outer one.
  return compact({
    '@type': 'OrganizationRole',
    roleName: role.title,
    startDate: isoMonth(role.start),
    endDate: isoMonth(role.end),
    description: role.bullets[0],
    [property]: ref(ids.org(site, role.id)),
  });
}

export function personNode(site: SiteInput, person: PersonInput, roles: RoleInput[], stack: string[]): JsonLdNode {
  const withOrg = roles.filter((role) => role.org);
  const current = withOrg.filter(isCurrent);
  const past = withOrg.filter((role) => !isCurrent(role));
  const knowsAbout = [...new Set([...person.skills, ...stack])];

  return compact({
    '@type': 'Person',
    '@id': ids.person(site),
    name: person.name,
    alternateName: person.handle,
    url: `${site.origin}/`,
    mainEntityOfPage: ref(ids.page(`${site.origin}/resume`)),
    image: person.image
      ? compact({ '@type': 'ImageObject', url: absolute(site, person.image), caption: person.imageAlt })
      : undefined,
    jobTitle: person.jobTitle,
    description: person.summary,
    disambiguatingDescription: person.headline,
    sameAs: person.sameAs,
    knowsAbout,
    knowsLanguage: site.language.split('-')[0],
    homeLocation: person.location
      ? compact({
          '@type': 'Place',
          address: compact({
            '@type': 'PostalAddress',
            addressLocality: person.location.locality,
            addressRegion: person.location.region,
            addressCountry: person.location.country,
          }),
        })
      : undefined,
    worksFor: current.map((role) => roleRelation(site, role, 'worksFor')),
    alumniOf: past.map((role) => roleRelation(site, role, 'alumniOf')),
    hasOccupation: compact({
      '@type': 'Occupation',
      name: person.jobTitle,
      skills: person.skills.join(', '),
      occupationLocation: person.location?.country
        ? { '@type': 'Country', name: person.location.country }
        : undefined,
    }),
    makesOffer: person.services.map((service) =>
      compact({
        '@type': 'Offer',
        itemOffered: compact({
          '@type': 'Service',
          name: service.name,
          description: service.description,
          provider: ref(ids.person(site)),
          areaServed: person.location?.remote ? 'Remote' : undefined,
        }),
      }),
    ),
    contactPoint: person.contact
      ? compact({ '@type': 'ContactPoint', contactType: person.contact.label, url: absolute(site, person.contact.url) })
      : undefined,
  });
}

/** Nodes every page carries: the site, the person and the organizations the person references. */
export function siteGraph(bundle: Bundle): JsonLdNode[] {
  return [
    websiteNode(bundle.site),
    personNode(
      bundle.site,
      bundle.person,
      bundle.roles,
      bundle.stack.map((row) => row.name),
    ),
    ...organizationNodes(bundle.site, bundle.roles),
  ];
}

export function breadcrumbNode(site: SiteInput, url: string, trail: { name: string; path: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(url),
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absolute(site, crumb.path),
    })),
  };
}

export type PageType = 'WebPage' | 'ProfilePage' | 'CollectionPage' | 'AboutPage' | 'ItemPage' | 'ContactPage';

export function pageNode(
  site: SiteInput,
  input: {
    url: string;
    type?: PageType;
    name: string;
    description: string;
    image?: string;
    breadcrumb?: boolean;
    dateModified?: string;
    extra?: JsonLdNode;
  },
): JsonLdNode {
  return compact({
    '@type': input.type ?? 'WebPage',
    '@id': ids.page(input.url),
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: site.language,
    isPartOf: ref(ids.website(site)),
    about: ref(ids.person(site)),
    author: ref(ids.person(site)),
    primaryImageOfPage: input.image ? { '@type': 'ImageObject', url: absolute(site, input.image) } : undefined,
    breadcrumb: input.breadcrumb ? ref(ids.breadcrumb(input.url)) : undefined,
    dateModified: input.dateModified,
    ...(input.extra ?? {}),
  });
}

export function workNode(site: SiteInput, work: WorkInput): JsonLdNode {
  const creator = ref(ids.person(site));
  return compact({
    '@type': 'CreativeWork',
    '@id': ids.work(work.url),
    url: work.url,
    mainEntityOfPage: ref(ids.page(work.url)),
    name: work.title,
    headline: work.title,
    abstract: work.summary,
    description: work.dek ?? work.summary,
    genre: work.kind,
    // Role pattern: "creator" wraps the person with what they did on this work.
    creator: work.role ? { '@type': 'Role', roleName: work.role, creator } : creator,
    sourceOrganization: work.org ? ref(ids.org(site, work.org)) : undefined,
    dateCreated: isoMonth(work.period?.start),
    temporalCoverage: work.period ? `${work.period.start}/${work.period.end ?? '..'}` : undefined,
    keywords: work.technologies.join(', '),
    sameAs: work.demo,
    isBasedOn: work.source,
    image: work.images.map((image) => ({ '@type': 'ImageObject', url: absolute(site, image.src), caption: image.alt })),
    additionalProperty: [
      ...work.facts.map((fact) => ({ '@type': 'PropertyValue', name: fact.label, value: fact.value })),
      ...work.outcomes.map((outcome) =>
        compact({
          '@type': 'PropertyValue',
          propertyID: 'outcome',
          name: outcome.metric,
          value: outcome.value,
          description: outcome.context,
        }),
      ),
    ],
    hasPart: work.highlights.map((note) => ({ '@type': 'CreativeWork', name: note.title, text: note.text })),
  });
}

export function itemListNode(site: SiteInput, url: string, name: string, items: { url: string; name: string }[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    '@id': `${url}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolute(site, item.url),
      name: item.name,
    })),
  };
}

function words(markdown?: string): number | undefined {
  if (!markdown) return undefined;
  const text = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`[\]()!-]/g, ' ');
  const count = text.split(/\s+/).filter(Boolean).length;
  return count || undefined;
}

export function postNode(site: SiteInput, post: PostInput, person: PersonInput): JsonLdNode {
  return compact({
    '@type': 'BlogPosting',
    '@id': ids.post(post.url),
    url: post.url,
    mainEntityOfPage: ref(ids.page(post.url)),
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: site.language,
    author: ref(ids.person(site)),
    publisher: ref(ids.person(site)),
    image: person.image ? absolute(site, person.image) : undefined,
    keywords: post.tags.join(', '),
    wordCount: words(post.body),
    isPartOf: { '@type': 'Blog', '@id': `${site.origin}/blog#blog` },
  });
}

export function blogNode(site: SiteInput, posts: PostInput[]): JsonLdNode {
  return {
    '@type': 'Blog',
    '@id': `${site.origin}/blog#blog`,
    url: `${site.origin}/blog`,
    name: `Writing · ${site.name}`,
    author: ref(ids.person(site)),
    blogPost: posts.map((post) => ref(ids.post(post.url))),
  };
}

/** A self-assessment page: each section is a ListItem the page's mainEntity points at. */
export function essayListNode(site: SiteInput, essay: EssayInput): JsonLdNode {
  const url = absolute(site, essay.path);
  return {
    '@type': 'ItemList',
    '@id': `${url}#list`,
    name: essay.title,
    description: essay.description,
    numberOfItems: essay.sections.length,
    itemListElement: essay.sections.map((section, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${url}#${section.id}`,
      name: section.title,
      description: section.paragraphs.join(' '),
    })),
  };
}

export function apiNode(site: SiteInput, input: { path: string; name: string; description: string; docs: string }): JsonLdNode {
  return {
    '@type': 'WebAPI',
    '@id': `${absolute(site, input.path)}#api`,
    name: input.name,
    description: input.description,
    url: absolute(site, input.path),
    documentation: absolute(site, input.docs),
    provider: ref(ids.person(site)),
  };
}

/** Serializes a graph for a <script type="application/ld+json"> tag, safe against "</script>" in content. */
export function serializeGraph(nodes: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
