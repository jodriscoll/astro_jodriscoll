# Agent layer

Makes the site readable by machines: search engines, LLM crawlers, recruiting
platforms and ATS importers. It is built to be lifted out as its own package.

## What it emits

| Output | Where | Read by |
| --- | --- | --- |
| JSON-LD `@graph` | `<head>` of every page, via `Base.astro` | Google, Bing, LLM crawlers, ATS enrichment |
| `llms.txt` | `/llms.txt` | Agents that follow [llmstxt.org](https://llmstxt.org) |
| `llms-full.txt` | `/llms-full.txt` | Agents that want every public fact in one request |
| JSON Resume v1 | `/resume.json` | ATS importers, resume tools, agents |
| Open Graph, Twitter, `rel=me`, `rel=alternate` | `<head>` | Link unfurlers, identity checks, discovery |

The graph is one `Person`, one `WebSite` and one `Organization` per employer,
each with a stable `@id` (`/#person`, `/#website`, `/#org-<role id>`). Page
nodes reference them instead of repeating them. Career history uses the
schema.org Role pattern (`worksFor` / `alumniOf` wrapping `OrganizationRole`
with dates), and each case study is a `CreativeWork` whose `creator` carries
the role played on it.

## Files

- `types.ts`: the portable input shape (`Bundle`).
- `schema.ts`, `llms.ts`, `jsonresume.ts`: pure builders. No Astro, no I/O.
- `map.ts`: this site's records to a `Bundle`. Reads the public gateway only,
  so drafts and `internal` notes cannot reach the output.
- `site.ts`: the Astro loader. The only file that imports `astro:content`.

## Adding facts

- **Measured results**: add `outcomes` to a spec in `content/specs/*.json`:
  `[{ "metric": "Home page load", "value": "20 s to 1.8 s", "context": "..." }]`.
  They flow into the work's JSON-LD (`additionalProperty`), `llms-full.txt` and
  `resume.json` highlights. Leave it out rather than estimate.
- **Location, handle, share image, contact route**: `content/agent.json`.
- **Weaknesses copy**: `content/weaknesses.json`. The page renders from it.

## Rules it keeps

- No email anywhere: contact goes through the form, as `protect.ts` intends.
- Undated roles are never called current.
- Year-month dates stay `YYYY-MM`. No invented days.
- `</script>` cannot break out of the JSON-LD tag (`serializeGraph` escapes `<`).
