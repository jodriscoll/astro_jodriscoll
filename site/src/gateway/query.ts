import { getProfile, getResume, isDraftProject, listProjects, listTechnologies, projectVisibility } from './catalog';
import { getPostRecord, listPostEntries, toPublicPost } from './posts';
import { translatePost, translateProfile, translateProject, translateRole } from './translate';
import { GATEWAY, GATEWAY_VERSION, type Stack } from './types';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type QueryResult =
  | { ok: true; body: unknown }
  | { ok: false; status: number; error: string };

function ok(stack: Stack, data: unknown): QueryResult {
  return { ok: true, body: { gateway: GATEWAY, version: GATEWAY_VERSION, stack, data } };
}

function fail(status: number, error: string): QueryResult {
  return { ok: false, status, error };
}

function presentProject(slug: string, record: unknown, includeDrafts: boolean): unknown {
  if (includeDrafts && isDraftProject(slug)) return { visibility: 'draft', record };
  return record;
}

export async function queryContent(
  segments: string[],
  options: { stack: Stack; includeDrafts: boolean },
): Promise<QueryResult> {
  const { stack, includeDrafts } = options;
  const [head, slug, extra] = segments;
  if (extra) return fail(404, 'not_found');
  if (slug && !SLUG.test(slug)) return fail(404, 'not_found');

  if (!head) {
    const [posts, resume] = await Promise.all([listPostEntries(includeDrafts), Promise.resolve(getResume())]);
    return ok(stack, {
      profile: translateProfile(getProfile(), stack),
      experience: resume.roles.map((role) => translateRole(role, stack)),
      projects: listProjects(includeDrafts).map((project) =>
        presentProject(project.slug, translateProject(project, stack), includeDrafts),
      ),
      posts: posts.map((entry) => {
        const record = translatePost(toPublicPost(entry, false), stack);
        return includeDrafts && entry.data.visibility === 'draft' ? { visibility: 'draft', record } : record;
      }),
      technologies: listTechnologies(),
      stats: resume.stats,
    });
  }

  if (head === 'profile' && !slug) return ok(stack, translateProfile(getProfile(), stack));

  if (head === 'technologies' && !slug) return ok(stack, listTechnologies());

  if (head === 'resume' && !slug) {
    const resume = getResume();
    return ok(stack, {
      profile: translateProfile(resume.profile, stack),
      roles: resume.roles.map((role) => translateRole(role, stack)),
      projects: resume.projects.map((project) => translateProject(project, stack)),
      stats: resume.stats,
    });
  }

  if (head === 'projects' && !slug) {
    return ok(
      stack,
      listProjects(includeDrafts).map((project) =>
        presentProject(project.slug, translateProject(project, stack), includeDrafts),
      ),
    );
  }

  if (head === 'projects' && slug) {
    const project = projectVisibility(slug, includeDrafts);
    if (!project) return fail(404, 'not_found');
    return ok(stack, presentProject(slug, translateProject(project, stack), includeDrafts));
  }

  if (head === 'posts' && !slug) {
    const posts = await listPostEntries(includeDrafts);
    return ok(
      stack,
      posts.map((entry) => {
        const record = translatePost(toPublicPost(entry, false), stack);
        return includeDrafts && entry.data.visibility === 'draft' ? { visibility: 'draft', record } : record;
      }),
    );
  }

  if (head === 'posts' && slug) {
    const entry = await getPostRecord(slug, includeDrafts);
    if (!entry) return fail(404, 'not_found');
    const record = translatePost(toPublicPost(entry, true), stack);
    const data = includeDrafts && entry.data.visibility === 'draft' ? { visibility: 'draft', record } : record;
    return ok(stack, data);
  }

  return fail(404, 'not_found');
}
