export const GATEWAY = 'jodriscoll-content';
export const GATEWAY_VERSION = 1;

export const STACKS = [
  'canonical',
  'astro',
  'next',
  'react',
  'angular',
  'ember',
  'svelte',
  'vue',
  'wordpress',
  'drupal',
] as const;

export type Stack = (typeof STACKS)[number];

export type HostStack = Exclude<Stack, 'canonical'>;

export type Visibility = 'public' | 'draft';

export type Employment = 'Full-Time' | 'Contractor' | 'Internship';

export type MixId = Employment | 'Leader';

export type TechnologyStatus = 'live' | 'gateway';

export type Service = {
  title: string;
  text: string;
};

export type ProjectLinks = {
  demo?: string;
  source?: string;
};

export type Availability = 'online' | 'offline';

export type ProjectSource = {
  slug: string;
  title: string;
  summary: string;
  featured: boolean;
  technologies: string[];
  links: ProjectLinks;
  visibility: Visibility;
  availability?: Availability;
  internal?: { notes?: string };
};

export type PublicProject = {
  slug: string;
  title: string;
  summary: string;
  featured: boolean;
  technologies: string[];
  links: ProjectLinks;
  images: string[];
  availability?: Availability;
};

export type RoleSource = {
  id: string;
  org: string;
  title: string;
  start: string | null;
  end: string | null;
  employment: Employment | null;
  /** The role began under another arrangement (an internship) until this YYYY-MM, then became `employment`. */
  startedAs?: { employment: Employment; until: string };
  location: string;
  bullets: string[];
  visibility: Visibility;
  relation?: string;
  leader: boolean;
  parent?: string;
  internal?: { notes?: string };
};

export type PublicRole = {
  id: string;
  org: string;
  title: string;
  start: string | null;
  end: string | null;
  displayDate: string;
  duration: string;
  months: number;
  employment: Employment | null;
  startedAs?: { employment: Employment; until: string; months: number };
  relation: string;
  location: string;
  bullets: string[];
  leader: boolean;
  parent: string;
};

export type PublicProfile = {
  name: string;
  role: string;
  headline: string;
  summary: string;
  about: string[];
  services: Service[];
  skills: string[];
  email: string;
  links: { github: string; linkedin: string };
  contact: { title: string; text: string; action: string };
};

export type Technology = {
  id: HostStack;
  name: string;
  host: string;
  status: TechnologyStatus;
  summary: string;
};

export type PublicPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  body?: string;
};

export type EmploymentShare = {
  id: MixId;
  label: string;
  months: number;
};

export type ResumeStats = {
  startYear: number;
  endYear: number;
  spanYears: number;
  roleCount: number;
  projectCount: number;
  longest: { org: string; duration: string; months: number };
  employment: EmploymentShare[];
};

export type Resume = {
  profile: PublicProfile;
  roles: PublicRole[];
  projects: PublicProject[];
  stats: ResumeStats;
};
