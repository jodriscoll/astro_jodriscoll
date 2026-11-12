import { getCollection, getEntry } from 'astro:content';
import { formatIsoDate } from './dates';
import { publishPost } from './protect';
import type { PublicPost } from './types';

export type BlogEntry = {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    date: Date;
    visibility: 'public' | 'draft';
  };
};

function isPublic(entry: BlogEntry): boolean {
  return entry.data.visibility === 'public';
}

export async function listPostEntries(includeDrafts = false): Promise<BlogEntry[]> {
  const entries = (await getCollection('blog')) as BlogEntry[];
  return entries
    .filter((entry) => isPublic(entry) || includeDrafts)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPostEntry(slug: string): Promise<BlogEntry | undefined> {
  const entry = (await getEntry('blog', slug)) as BlogEntry | undefined;
  if (!entry || !isPublic(entry)) return undefined;
  return entry;
}

export async function getPostRecord(slug: string, includeDrafts: boolean): Promise<BlogEntry | undefined> {
  const entry = (await getEntry('blog', slug)) as BlogEntry | undefined;
  if (!entry) return undefined;
  if (!isPublic(entry) && !includeDrafts) return undefined;
  return entry;
}

export function toPublicPost(entry: BlogEntry, includeBody: boolean): PublicPost {
  return publishPost(
    {
      slug: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      date: formatIsoDate(entry.data.date),
      body: entry.body,
    },
    includeBody,
  );
}
