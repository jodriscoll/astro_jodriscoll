---
title: "Measure before you restyle"
description: "A redesign made the portfolio's Work page 653 KB of HTML. Measuring it found one decoration responsible for 37% of that, and one change cut the page by 29%."
date: 2026-11-10
visibility: public
tags: [jodriscoll.com, Performance, Measurement]
---

Open the Work page on this site tonight and the browser downloads 652,734 bytes of HTML before it fetches a single stylesheet. After one change, it's 463,342. Nothing on the page looks different. The cards still have their scrolling code graphs, the filters still work, and the same sixteen projects are there.

The change is live in the portfolio's source and measured on the dev server. Production numbers will be smaller, for reasons covered under results.

This post covers how the page got that heavy, how I found the weight, and the one change that removed most of it. It also covers the weight that's still there on purpose.

## Three questions before any restyle

When a page feels slow, the stylesheet is rarely the first place to look. I start with what the browser has to download and run.

1. How much arrives before the first paint, and what is it?
2. Which element is the largest paint, and does it have a size?
3. What runs on the main thread when someone clicks?

This site was built to make those answers boring. The pages are static HTML and CSS from Astro. There's no component framework in the browser, only small inline scripts, one per behaviour. The project pages, for example, have a script that only listens for the arrow keys:

```js
addEventListener('keydown', (event) => {
  if (event.metaKey || event.altKey || event.ctrlKey) return;
  if (event.key === 'ArrowLeft' && prevHref) location.href = prevHref;
  if (event.key === 'ArrowRight' && nextHref) location.href = nextHref;
});
```

Keep the first question in mind. It's the one this redesign failed.

## The redesign

Today the site got a new shell: a fixed left rail, isometric line drawings, a 3D line portrait on the home page, and behind every project card, a small code minimap. Each minimap is drawn from the project's language mix, so a WordPress card scrolls purple PHP and a GameKal card scrolls blue TypeScript. They're decoration, and they're drawn on the server as inline SVG, so they cost no JavaScript.

That last sentence is where it went wrong. No JavaScript isn't the same as no bytes.

## November 10: the measurement

I fetched each page from the dev server and parsed it in the browser, then summed the size of the HTML, every inline script, and every element I'd added in the redesign.

**The code graphs were 37% of the Work page.** Sixteen of them came to 241,031 bytes, about 15 KB each, inside a 652,734-byte document.

**Each graph was built for clarity, not size.** Every token of fake code was its own `<rect>` with five attributes, and every graph was drawn twice so the scroll could loop without a seam. A forty-six-row minimap became a few hundred rectangles, then doubled.

**The home page carried the same cost.** Seven code graphs came to 107,172 bytes, out of 451,440.

Why hadn't it shown up while building? The pages looked right and loaded fast on a laptop on the same machine as the server. The question was never "does it feel slow" but "what arrives first", and nobody had asked it yet.

## The change

The drawing didn't change; the way it's written down did.

**One path per colour instead of one shape per token.** A graph has at most six or seven language colours. Each colour is now a single `<path>`, and each token inside it is a short `M x y h w` command: move to a point, draw a horizontal line of a given width. The round caps come from `stroke-linecap`, set once on the group.

**Whole numbers instead of decimals.** Token positions are rounded to whole viewBox units. At the size the graphs are shown, the difference is below a pixel.

I rendered the old and new versions of the same graph side by side before shipping it. They're the same picture.

## Results

The page that was 652,734 bytes is now 463,342, down 29%. The code graphs on it went from 241,031 bytes to 33,123, down 86%, or about 2 KB each.

```bars
{
  "title": "HTML before and after one change",
  "subtitle": "Uncompressed HTML of each page, and the part of it that was code graphs. Lower is better.",
  "unit": "KB",
  "max": 700,
  "ticks": [0, 175, 350, 525, 700],
  "legend": [
    { "label": "Before, Nov 10", "tone": "muted" },
    { "label": "After, Nov 10", "tone": "accent" }
  ],
  "groups": [
    {
      "label": "Work page",
      "sublabel": "whole document",
      "bars": [
        { "value": 652.7, "display": "652.7 KB", "tone": "muted" },
        { "value": 463.3, "display": "463.3 KB", "tone": "accent" }
      ]
    },
    {
      "label": "Work page",
      "sublabel": "16 code graphs",
      "bars": [
        { "value": 241.0, "display": "241.0 KB", "tone": "muted" },
        { "value": 33.1, "display": "33.1 KB", "tone": "accent" }
      ]
    },
    {
      "label": "Home page",
      "sublabel": "whole document",
      "bars": [
        { "value": 451.4, "display": "451.4 KB", "tone": "muted" },
        { "value": 367.2, "display": "367.2 KB", "tone": "accent" }
      ]
    },
    {
      "label": "Home page",
      "sublabel": "7 code graphs",
      "bars": [
        { "value": 107.2, "display": "107.2 KB", "tone": "muted" },
        { "value": 14.7, "display": "14.7 KB", "tone": "accent" }
      ]
    }
  ],
  "note": "Measured on the Astro dev server, November 10, 2026, by fetching each page and parsing it in the browser.\nOne measurement per page: HTML size doesn't vary between loads. Uncompressed bytes, not transfer size."
}
```

These are dev-server numbers, and they overstate production. The dev server inlines all 96,767 bytes of CSS into every page and adds its own toolbar script; a production build links the CSS as cached files. Compression will shrink the repeated path commands further still. The ratio is what to notice: one decoration was more than a third of the page.

## What I kept

The graphs stayed. They're the most alive thing on the Work page, and at 2 KB each they cost less than one small image. The no-framework rule stayed too. The inline scripts on the home page tonight include a theme switcher at 782 bytes, the footer at 576, tooltips at 2,688 and the contact dialog at 9,412, and none of them depends on another.

## Costs and trade-offs

**The portrait is heavy on purpose.** The 3D line portrait on the home page is a 46,358-byte inline script, and almost all of it is the face: 112 rows by 96 columns of depth and brightness, packed as base64. It's the largest single thing on the home page.

**The line drawings are still verbose.** The isometric city in the home page's closing section is 44,320 bytes of SVG. It uses one path per face and per window line, which is the same mistake the code graphs made.

## What I learned

Looking back, three lessons stand out.

**"No JavaScript" isn't a budget.** Inline SVG is free for the main thread and expensive for the network. The first question is about bytes, and it applies to markup too.

**Write decoration the way the browser reads it.** A `<rect>` per token was easy to reason about and wasteful to send. The same picture as a handful of paths is a seventh of the size.

**Measure the page you shipped, not the one you remember.** The graphs were added in an afternoon of design changes. Only the numbers showed what they cost.

## What's next?

The isometric drawings get the same treatment as the code graphs, merging their window lines into one path per building. The portrait's data moves out of the HTML into a cached file that loads after first paint. Then I measure again on the production build on Vercel, where the 463 KB number should drop well below this one.

The page looks exactly as it did this morning. It's just 29% lighter, because I asked the first question before the next restyle instead of after.
