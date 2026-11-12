---
title: "Icons are a performance budget too"
description: "Switching to SVG is where icon performance starts, not where it ends. Ten small fixes, sorted by what they actually cost you, and the one rule that decides which of them to use."
date: 2026-10-28
visibility: public
tags: [Performance, SVG, CSS, Accessibility]
---

This site's Work page was once 652,734 bytes of HTML, and 241,031 of them were sixteen small decorative SVGs. They cost no JavaScript, they looked great, and they were more than a third of the page. I wrote that up in [Measure before you restyle](/blog/measure-before-you-restyle).

Most icon advice would have called those graphs "done": they were SVG, not PNG. That's the floor. [theSVG's list of icon performance hacks](https://thesvg.org/blog/svg-icon-performance-hacks-2026) makes the same point and collects ten fixes past it, most of them one property or one attribute. This post walks through them the way I'd use them, sorted by what each one protects: bytes and paint, correctness across themes and screen readers, and repeat visits.

It also covers the rule that decides whether any of them is worth doing on a given page.

## Bytes and paint

These are the fixes that show up in a performance trace.

**Stop the shift before the file arrives.** An icon with no size reserves nothing until it loads, then pushes the layout down. Give it a box up front: `width` and `height` attributes on the `<img>`, or a width plus `aspect-ratio: 1 / 1` in CSS. Either way the browser reserves the space on first layout, and the Cumulative Layout Shift goes away for free.

**Skip what's off screen.** On a grid of hundreds or thousands of icons, most cards aren't visible. `content-visibility: auto` tells the browser it can skip layout and paint for them until they scroll near the viewport:

```css title="icon-grid.css"
.icon-card {
  content-visibility: auto;
  /* "auto" remembers the real size once a card has rendered */
  contain-intrinsic-size: auto 120px;
}
```

The `contain-intrinsic-size` line matters. Without it, skipped cards collapse to zero height, the scrollbar lies, and it jumps as you scroll. With `auto`, the browser uses 120px as a guess until it has measured a card, then remembers the real size. It's not a virtualisation library, but on a long grid it does a lot of the same work.

**Know when inline SVG stops being worth it.** Pasting SVG markup into the page is the right call for a handful of icons you style or animate with CSS. At scale, each one is a separate set of DOM nodes your framework has to diff and the browser can't cache. Past a few hundred, `<img src="icon.svg">` or a sprite sheet referenced with `<use href="sprite.svg#icon">` is usually lighter. "Usually" is doing work in that sentence, and the last section is about why.

My code graphs were the expensive version of this: one `<rect>` per token, every graph drawn twice. Merging them into one `<path>` per colour cut them by 86% without changing a pixel.

## Correct in every theme

These don't make a page faster. They stop it from being wrong, which is the more expensive bug.

**Let single-colour icons inherit their colour.** If a mark is one flat colour, don't hardcode it. Set `fill="currentColor"` and it follows the text around it: hover, disabled, dark mode, all with no extra files and no JavaScript.

**When you can't edit the markup, use it as a mask.** Sometimes you only have the `.svg` file and you need it in a design-token colour. `filter: invert()` and `hue-rotate()` only approximate a colour, and you tune them by eye. A mask gets it exactly, because the icon's shape becomes a stencil over a solid background:

```css title="recolor.css"
.icon {
  width: 24px;
  aspect-ratio: 1 / 1;
  background-color: var(--accent);
  -webkit-mask: url("/icons/check.svg") center / contain no-repeat;
  mask: url("/icons/check.svg") center / contain no-repeat;
}
```

Both of these are for genuinely single-colour marks. A multi-colour brand logo pushed through `currentColor` or a mask comes out as a silhouette.

**Ship a real dark variant for anything multi-colour.** `filter: invert(1)` looks right on a black-on-white mark and nowhere else. Inverted brand colours are colours the brand never chose. Store a light and a dark file, and let the browser pick. CSS can't swap an `<img>`'s source, but `<picture>` can:

```html title="logo.html"
<picture>
  <source srcset="/logos/vercel-dark.svg" media="(prefers-color-scheme: dark)" />
  <img src="/logos/vercel-light.svg" alt="Vercel" width="96" height="24" />
</picture>
```

That handles the system setting. If the site has its own theme toggle, as this one does, the toggle also has to update the `src` when it fires, because `prefers-color-scheme` only knows what the operating system says.

**Decide what the icon means to a screen reader.** There are two cases, and mixing them up is the most common icon accessibility bug. An icon next to visible text is decoration: give it `aria-hidden="true"` so it isn't announced as "image" or a file name. An icon that is the only content of a button carries the meaning: put `aria-label` on the button, not on the SVG inside it.

## Repeat visits and input

**Cache icons forever, but only once they're fingerprinted.** Published SVGs rarely change, so `Cache-Control: public, max-age=31536000, immutable` lets a returning visitor skip the network completely, with no `304` round trip. The catch is `immutable`: it tells the browser never to check back. On a file whose name doesn't change when its contents do, an edit can stay invisible to visitors for a year. Use it only on hashed filenames. Astro hashes what it bundles into `/_astro/`; files in `public/` keep their names, so they need a shorter policy or a hash of their own.

**Debounce the search, not the input.** A live icon search that re-filters thousands of records on every keystroke is fine on a laptop and stutters on a mid-range phone. Keep the text field as plain local state so typing is instant, and delay only the expensive filter until the typing pauses:

```jsx title="IconSearch.jsx"
useEffect(() => {
  const id = setTimeout(() => setResults(search(query)), 180);
  return () => clearTimeout(id);
}, [query]);
```

Somewhere between 150 and 200ms is long enough to skip the work for fast typists and short enough that nobody notices. In React 18 and later, `useDeferredValue` is the other option: it keeps the input responsive by letting the slow render fall behind, rather than waiting a fixed time.

## The rule that picks the fix

Every fix above can be applied where it does nothing. `content-visibility` on my Work page's sixteen cards would save almost nothing, because nearly all of them are near the first screen. A 180ms debounce on a list of fifty icons is just 180ms of lag.

So the order is always the same. Open the performance panel, or just measure the bytes, find the thing that's actually slow, and pick the fix that matches it. That's how I found the code graphs: not by guessing which decoration was heavy, but by adding up what each one weighed.

## What I learned

Looking back, three lessons stand out.

**SVG is a format, not an optimisation.** My graphs were SVG and still a third of the page. How the file is written matters as much as what kind of file it is.

**The cheapest fixes are about correctness.** `currentColor`, a real dark variant and the right ARIA attribute cost almost nothing and prevent the bugs users actually report.

**A fix without a measurement is a guess.** Each of these has a page where it helps and a page where it only adds code.

## What's next?

The isometric line drawings on the home page are next. They have the same one-shape-per-line problem the code graphs had, and they get the same treatment and the same before-and-after numbers. The logos on the Stacks page are the other candidate, and they'll get dark variants instead of a filter.

The icons on this site were already SVG. Now I check what they cost instead of assuming.
