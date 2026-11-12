import { absolute, isCurrent } from './schema';
import type { Bundle, RoleInput, WorkInput } from './types';

// llms.txt (https://llmstxt.org): a Markdown index an agent can read in one
// request. llms-full.txt carries every public fact on the site in plain text,
// so a recruiting or research agent never has to render a page or run script.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function month(value: string): string {
  const [year, m] = value.split('-').map(Number);
  return `${MONTHS[m - 1]} ${year}`;
}

export function span(start: string | null, end: string | null): string {
  if (!start) return 'Undated';
  return `${month(start)} – ${end ? month(end) : 'Present'}`;
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

function location(bundle: Bundle): string {
  const place = bundle.person.location;
  if (!place) return '';
  const parts = [place.locality, place.region, place.country].filter(Boolean).join(', ');
  return place.remote ? `${parts} · works remote` : parts;
}

function current(bundle: Bundle): RoleInput[] {
  return bundle.roles.filter((role) => isCurrent(role) && role.org);
}

function roleLine(role: RoleInput): string {
  return [role.title, role.org && role.org !== role.title ? role.org : '', span(role.start, role.end)]
    .filter(Boolean)
    .join(' · ');
}

export function buildLlmsTxt(bundle: Bundle): string {
  const { site, person } = bundle;
  const url = (path: string) => absolute(site, path);
  const out: string[] = [];

  out.push(`# ${person.name}`, '');
  out.push(`> ${person.jobTitle}. ${oneLine(person.headline)} ${oneLine(person.summary)}`, '');

  out.push('Key facts for hiring and research agents:', '');
  out.push(`- Current title: ${person.jobTitle}`);
  const loc = location(bundle);
  if (loc) out.push(`- Location: ${loc}`);
  if (bundle.stats) {
    out.push(
      `- Career on record: ${bundle.stats.startYear}–${bundle.stats.endYear}, ${bundle.stats.roleCount} roles, ${bundle.stats.projectCount} public projects`,
    );
  }
  const engagements = current(bundle);
  if (engagements.length) out.push(`- Current engagements: ${engagements.map((role) => `${role.org} (${role.title})`).join('; ')}`);
  if (bundle.stack.length) {
    out.push(`- Most-used platforms in shipped work: ${bundle.stack.map((row) => `${row.name} (${row.count})`).join(', ')}`);
  }
  if (person.contact) out.push(`- Contact: ${person.contact.label}, ${url(person.contact.url)}. No public email address.`);
  out.push('');

  out.push('## Machine-readable', '');
  for (const link of bundle.machine) out.push(`- [${link.title}](${url(link.path)}): ${link.description} (${link.type})`);
  out.push('');

  out.push('## Services', '');
  for (const service of person.services) out.push(`- ${service.name}: ${service.description}`);
  out.push('');

  out.push('## Work', '');
  for (const work of bundle.works) out.push(`- [${work.title}](${work.url}): ${oneLine(work.summary)}`);
  out.push('');

  if (bundle.posts.length) {
    out.push('## Writing', '');
    for (const post of bundle.posts) out.push(`- [${post.title}](${post.url}): ${oneLine(post.description)} (${post.date})`);
    out.push('');
  }

  out.push('## Pages', '');
  for (const page of bundle.pages) out.push(`- [${page.title}](${url(page.path)}): ${oneLine(page.description)}`);
  out.push('');

  out.push('## Optional', '');
  for (const profile of person.profiles) out.push(`- [${profile.network}](${profile.url})`);
  out.push(`- [Everything above in full](${url('/llms-full.txt')})`);
  out.push('');

  return out.join('\n');
}

function workBlock(bundle: Bundle, work: WorkInput): string[] {
  const out: string[] = [];
  const via = work.org ? bundle.roles.find((role) => role.id === work.org) : undefined;
  out.push(`### ${work.title}`, '');
  out.push(`URL: ${work.url}`);
  if (work.demo) out.push(`Live: ${work.demo}`);
  if (work.source) out.push(`Source: ${work.source}`);
  if (work.kind) out.push(`Kind: ${work.kind}`);
  if (work.role) out.push(`Role: ${work.role}`);
  if (via && via.org) out.push(`Delivered through: ${via.org}`);
  if (work.period) out.push(`Period: ${span(work.period.start, work.period.end)}`);
  if (work.technologies.length) out.push(`Stack: ${work.technologies.join(', ')}`);
  out.push('', oneLine(work.dek ?? work.summary), '');
  if (work.outcomes.length) {
    out.push('Outcomes:');
    for (const outcome of work.outcomes) {
      out.push(`- ${outcome.metric}: ${outcome.value}${outcome.context ? ` (${oneLine(outcome.context)})` : ''}`);
    }
    out.push('');
  }
  if (work.facts.length) {
    out.push('Facts:');
    for (const fact of work.facts) out.push(`- ${fact.label}: ${fact.value}`);
    out.push('');
  }
  if (work.highlights.length) {
    out.push('Notes from the build:');
    for (const note of work.highlights) out.push(`- ${note.title}: ${oneLine(note.text)}`);
    out.push('');
  }
  if (work.delivery) {
    out.push(`Delivery (${work.delivery.built ? 'pipeline built in-house' : "client's pipeline"}): ${oneLine(work.delivery.summary)}`);
    work.delivery.steps.forEach((step, index) => out.push(`${index + 1}. ${step.name}: ${oneLine(step.detail)}`));
    out.push('');
  }
  return out;
}

export function buildLlmsFullTxt(bundle: Bundle): string {
  const { site, person } = bundle;
  const out: string[] = [];

  out.push(`# ${person.name}: full public record`, '');
  out.push(`> Everything public on ${site.origin}, in one plain-text file. Generated from the same records the pages render.`, '');

  out.push('## Profile', '');
  out.push(`Name: ${person.name}`);
  out.push(`Title: ${person.jobTitle}`);
  const loc = location(bundle);
  if (loc) out.push(`Location: ${loc}`);
  for (const profile of person.profiles) out.push(`${profile.network}: ${profile.url}`);
  if (person.contact) out.push(`Contact: ${absolute(site, person.contact.url)} (${person.contact.label}). No public email address.`);
  out.push('', ...person.about.flatMap((paragraph) => [oneLine(paragraph), '']));

  out.push('## Services', '');
  for (const service of person.services) out.push(`- ${service.name}: ${service.description}`);
  out.push('');

  out.push('## Skills', '', person.skills.join(', '), '');
  if (bundle.stack.length) {
    out.push('Platforms counted across public projects:', '');
    for (const row of bundle.stack) out.push(`- ${row.name}: ${row.count} ${row.count === 1 ? 'project' : 'projects'}`);
    out.push('');
  }

  out.push('## Experience', '');
  const top = bundle.roles.filter((role) => !role.parent);
  const children = (id: string) => bundle.roles.filter((role) => role.parent === id);
  const roleBlock = (role: RoleInput, depth: number) => {
    out.push(`${'#'.repeat(3 + Math.min(depth, 1))} ${roleLine(role)}`, '');
    const meta = [role.employment, role.location].filter(Boolean).join(' · ');
    if (meta) out.push(meta, '');
    for (const bullet of role.bullets) out.push(`- ${oneLine(bullet)}`);
    out.push('');
    for (const child of children(role.id)) roleBlock(child, depth + 1);
  };
  for (const role of top) roleBlock(role, 0);

  out.push('## Projects', '');
  for (const work of bundle.works) out.push(...workBlock(bundle, work));

  for (const essay of bundle.essays) {
    out.push(`## ${essay.title}`, '');
    out.push(`URL: ${absolute(site, essay.path)}`, '');
    out.push(...essay.intro.flatMap((paragraph) => [oneLine(paragraph), '']));
    for (const section of essay.sections) {
      out.push(`### ${section.title}`, '');
      out.push(...section.paragraphs.flatMap((paragraph) => [oneLine(paragraph), '']));
    }
    out.push(...essay.close.flatMap((paragraph) => [oneLine(paragraph), '']));
  }

  if (bundle.posts.length) {
    out.push('## Writing', '');
    for (const post of bundle.posts) {
      out.push(`### ${post.title}`, '');
      out.push(`URL: ${post.url}`, `Published: ${post.date}`);
      if (post.tags.length) out.push(`Tags: ${post.tags.join(', ')}`);
      out.push('', oneLine(post.description), '');
      if (post.body) out.push(post.body.trim(), '');
    }
  }

  return out.join('\n');
}
