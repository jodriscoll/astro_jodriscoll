import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // Set when a post is materially revised; feeds dateModified and article:modified_time.
    updated: z.coerce.date().optional(),
    visibility: z.enum(['public', 'draft']).default('public'),
    tags: z.array(z.string()).default([]),
  }),
});

const labelled = z.object({ label: z.string(), value: z.string() });

const tool = z.object({
  name: z.string(),
  version: z.string().optional(),
  note: z.string().optional(),
});

const state = z.enum(['ok', 'warn', 'off']);

// One JSON file per project in content/specs. Everything here is public:
// commercial terms and private notes stay in projects.json `internal`.
const specs = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/specs' }),
  schema: z.object({
    slug: z.string(),
    org: z.string().optional(),
    kind: z.string(),
    // List order on /things-built: higher first, default 50. Keep side work low.
    weight: z.number().optional(),
    role: z.string().optional(),
    period: z.object({ start: z.string(), end: z.string().nullable() }).optional(),
    dek: z.string(),
    short: z.string().optional(),
    facts: z.array(labelled).default([]),
    languages: z
      .object({
        note: z.string(),
        items: z.array(z.object({ name: z.string(), bytes: z.number().positive() })),
      })
      .optional(),
    stack: z.array(z.object({ group: z.string(), items: z.array(tool) })).default([]),
    delivery: z
      .object({
        built: z.boolean(),
        summary: z.string(),
        // figure: one short headline number or token for the stage, shown in pipeline UIs.
        steps: z.array(z.object({ name: z.string(), detail: z.string(), figure: z.string().optional() })),
      })
      .optional(),
    // Resume showcase, only for projects picked to feature there: six stages
    // with one figure each, and the fact labels to show under them.
    showcase: z
      .object({
        steps: z.array(z.object({ name: z.string(), detail: z.string(), figure: z.string().optional() })),
        facts: z.array(z.string()).optional(),
      })
      .optional(),
    hosting: z.array(labelled).default([]),
    highlights: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    // Measured results, in the author's words. Feeds JSON-LD, llms.txt and
    // resume.json. Leave it out rather than estimate.
    outcomes: z
      .array(z.object({ metric: z.string(), value: z.string(), context: z.string().optional() }))
      .default([]),
    overview: z
      .array(
        z.object({
          group: z.string(),
          rows: z.array(z.object({ label: z.string(), value: z.string(), state: state.optional() })),
        }),
      )
      .default([]),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
          tall: z.boolean().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { blog, specs };
