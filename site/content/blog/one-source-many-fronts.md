---
title: "One source, many front ends"
description: "The portfolio keeps a single record of the work and translates it for nine front ends: WordPress, Drupal, React, Angular and more. Drafts and private notes never leave."
date: 2026-06-24
visibility: public
tags: [jodriscoll.com, Architecture, Content]
---

Ask this site for a project as a WordPress post and you get `post_title` and `post_excerpt`. Ask for the same project as a Drupal node and you get `title[0].value` and a `body` with a text format. Ask for it as React props and you get `id`, `tags` and `demoUrl`. It's one record in one JSON file, served in nine shapes, and none of them is a copy.

The gateway is live. The Astro front end you're reading uses it, and `/api/content` serves every other shape today. The other eight front ends aren't booted yet, so their shapes are tested by the type checker and the Stacks page, not by a running app.

This post covers why the content left the front end, how one request becomes the right shape, and what stops a draft or a private note from leaking. It also covers what this design costs.

## Where the content used to live

The previous jodriscoll.com was an Angular 13 app. Every word on it, from the job history to the project descriptions, lived in one translation file, `src/assets/i18n/en.json`, loaded through ngx-translate. A project looked like this:

```json
{ "Title": "TAK.gov", "Description": "…", "Images": ["…"], "demoLink": "https://tak.gov", "Technologies": ["Ruby", "AWS"] }
```

That made sense at the time. One app, one language file, nothing to synchronise. Keep the capitalised field names in mind, because they come back.

## The problem

**The content was shaped like its front end.** `Title` with a capital T, `demoLink` and `githubLink` were Angular template decisions baked into the data. Moving to any other framework meant rewriting the file or writing a converter for it.

**There was nowhere to keep a note that wasn't public.** Anything in `en.json` shipped to every visitor in the bundle. A draft project, a client's commercial terms, a half-written role: the only safe place for them was somewhere else entirely.

**A portfolio about many stacks only spoke one.** I've shipped on WordPress, Drupal, React, Vue and Angular. The site could only show that as a list of logos.

## The decision: a record, a gateway, and translations

The content moved into plain files under `content/`: `profile.json`, `experience.json`, `projects.json` and `technologies.json`, with posts as Markdown. Those files are the record. Nothing renders them directly.

Between the record and every front end sits a gateway in `src/gateway`. It's about 31 KB of TypeScript across six files, and every request takes the same path through it.

```steps
{
  "title": "One request through the gateway",
  "subtitle": "What happens between GET /api/content/projects/gamekal and the JSON that comes back. Not to scale.",
  "rows": [
    {
      "label": "Request",
      "sublabel": "?stack=drupal",
      "steps": [
        { "title": "Pick the shape", "detail": "resolveStack: the ?stack= parameter, or the first label of the host name, or astro" },
        { "title": "Check the slug", "detail": "Lower-case words and hyphens only. Anything else is a 404" }
      ],
      "group": {
        "title": "The allowlist",
        "detail": "Only public records, only named fields"
      }
    },
    {
      "label": "Response",
      "sublabel": "200, cached",
      "steps": [
        { "title": "Publish", "detail": "publishProject copies the fields a visitor may see, one by one" },
        { "title": "Translate", "detail": "translateProject reshapes them for the requested stack" },
        { "title": "Send", "detail": "JSON with public, max-age=60, s-maxage=3600" }
      ]
    }
  ],
  "note": "From src/gateway/stacks.ts, query.ts, protect.ts, translate.ts and http.ts."
}
```

**The shape comes from the host.** `resolveStack` reads `?stack=` first. Without it, the first label of the host name decides, so a request to `drupal.jodriscoll.com` gets Drupal fields and `jodriscoll.com` gets Astro's. An unknown stack is a `400` with `unknown_stack`, not a guess.

**Publishing is an allowlist, not a filter.** `publishProject` doesn't delete private fields from a record. It builds a new object and copies `slug`, `title`, `summary`, `featured`, `technologies` and the two links, by name. A field that isn't on that list can't reach a visitor, even one added to the JSON tomorrow. The Sequoia Capital record carries an `internal.notes` field, and it never leaves.

**Translation is one function per kind of record.** `translateProject`, `translateRole`, `translatePost` and `translateProfile` each switch on the stack. The Angular case returns `Title`, `Description`, `demoLink` and `githubLink`. Remember those capitals? They're the exact fields the old site's `en.json` used, so the old Angular app could read this gateway without changing a template.

**A forgotten stack fails the build.** Each switch ends in a `default` that assigns the stack to a `never`. Add a tenth stack to the `STACKS` list and forget one case, and TypeScript refuses to compile. Nobody finds out from a broken page.

## Drafts stay behind a token

Drafts are the reason the record exists, so they get the strictest rule. A post or project marked `visibility: draft` is invisible unless the request asks for `?drafts=1` and sends an `x-content-token` header. `draftsAllowed` compares that header with the `CONTENT_TOKEN` environment variable using `timingSafeEqual`, so a wrong guess takes as long as a right one. Without the token, the answer is a `401`.

When drafts are allowed, the response says so. Each draft comes back wrapped as `{ visibility: "draft", record }`, and the cache header switches to `private, no-store`, so a draft can't sit in a CDN.

There's a test for this that reads like a tripwire. `content/blog/private-draft.md` says, in its own body, "If this sentence is on the public site, the gateway failed." There's a draft project that says the same thing.

## What I kept

The static site didn't get slower for any of this. The Astro pages call the gateway's functions at build time, not over HTTP, so a visitor gets plain HTML and the gateway is never in the way. Only the `/api/content` routes run as functions, with `prerender = false`.

The old content survived too. The older project descriptions here, TAK.gov, Sequoia Capital, SageLife, i6tix and Rehab.com among them, started life in `en.json`. They moved, and their fields got lower-case names, but the words are the ones the Angular site shipped.

## What it costs

**Every field is written up to nine times.** Adding a field to projects means touching each case in `translateProject`. `translate.ts` is the biggest file in the gateway, at 10,263 bytes, and it's almost all field names.

**Images aren't public yet.** `publishProject` always sends `images: []`, because the record didn't hold image paths when the allowlist was written. The shapes are ready for them; the data isn't.

**Eight front ends are promises.** The shapes are checked by the compiler and shown on the Stacks page, but no running Next.js, Vue or Drupal app consumes them yet. A real consumer will find something a type can't.

## What I learned

Looking back, three lessons stand out.

**Content shaped like its framework is a migration you've already scheduled.** The capital-T `Title` cost nothing on day one and blocked every move after it.

**Copy fields in; don't strip them out.** An allowlist fails closed. A filter fails open the first time someone adds a field and forgets the filter.

**Make the compiler hold the list.** The `never` check turns "did I handle every stack?" from a review comment into a build error.

## What's next?

The first host to boot is `next.jodriscoll.com`, reading the Next.js shape from `/api/content` over HTTP rather than at build time. After that, project screenshots join the record and the allowlist, so `images` stops being an empty list in every shape.

The record was one file in an Angular bundle. It's still one record. It just doesn't belong to any one front end anymore.
