// Input shapes for the agent layer. Nothing in src/agent imports Astro or the
// gateway: a site maps its own records into these types (see site.ts) and the
// builders turn them into JSON-LD, llms.txt and JSON Resume. That seam is what
// lets this folder be lifted out as a package.

export type SiteInput = {
  /** Absolute origin without a trailing slash, e.g. https://jodriscoll.com */
  origin: string;
  name: string;
  /** BCP 47, e.g. en-US */
  language: string;
  description: string;
};

export type ServiceInput = { name: string; description: string };

export type PersonInput = {
  name: string;
  jobTitle: string;
  headline: string;
  summary: string;
  about: string[];
  /** Site-relative or absolute. */
  image?: string;
  imageAlt?: string;
  handle?: string;
  sameAs: string[];
  profiles: { network: string; url: string; username?: string }[];
  skills: string[];
  services: ServiceInput[];
  location?: { locality?: string; region?: string; country?: string; remote?: boolean };
  /** How a person reaches you. Never put an address here that the site keeps private. */
  contact?: { label: string; url: string };
};

export type RoleInput = {
  id: string;
  org: string;
  title: string;
  /** YYYY-MM, or null when undated. */
  start: string | null;
  end: string | null;
  location?: string;
  employment?: string;
  bullets: string[];
  parent?: string;
};

export type OutcomeInput = {
  /** What moved, e.g. "Largest Contentful Paint" or "Release cadence". */
  metric: string;
  /** The measured value or change, as written by the author. */
  value: string;
  context?: string;
};

export type WorkInput = {
  slug: string;
  /** Absolute URL of the case page. */
  url: string;
  title: string;
  summary: string;
  dek?: string;
  kind?: string;
  role?: string;
  /** Role id the work was delivered through. */
  org?: string;
  period?: { start: string; end: string | null };
  technologies: string[];
  demo?: string;
  source?: string;
  images: { src: string; alt: string }[];
  facts: { label: string; value: string }[];
  highlights: { title: string; text: string }[];
  outcomes: OutcomeInput[];
  delivery?: { built: boolean; summary: string; steps: { name: string; detail: string }[] };
  featured: boolean;
};

export type PostInput = {
  slug: string;
  url: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags: string[];
  /** Markdown source, when the full text should be exposed. */
  body?: string;
};

export type SectionInput = { id: string; title: string; paragraphs: string[] };

export type EssayInput = {
  path: string;
  title: string;
  description: string;
  intro: string[];
  sections: SectionInput[];
  close: string[];
};

export type PageInput = { path: string; title: string; description: string };

export type StatsInput = {
  startYear: number;
  endYear: number;
  roleCount: number;
  projectCount: number;
};

export type MachineLink = { path: string; title: string; description: string; type: string };

export type Bundle = {
  site: SiteInput;
  person: PersonInput;
  roles: RoleInput[];
  works: WorkInput[];
  posts: PostInput[];
  pages: PageInput[];
  essays: EssayInput[];
  stats?: StatsInput;
  stack: { name: string; count: number }[];
  machine: MachineLink[];
};

export type JsonLdNode = Record<string, unknown>;
