# ui/ — the design system

Three layers. Each one only talks to the layer under it.

| Layer | Where | Owns |
| --- | --- | --- |
| Theme | `src/styles/global.css`, `src/styles/shell.css` | Raw palette per theme (`--bg`, `--text`, `--line`…) |
| Tokens | `src/design/tokens.css` | Semantic `--ds-*` names, type/space/motion scales, print values, the print contract |
| Components | `src/components/ui/*`, `src/components/<feature>/*` | Markup + scoped styles that read `--ds-*` only |

## Primitives

| Component | Use it for |
| --- | --- |
| `Section` | Any page section. Numbered eyebrow over a hairline, optional title, lede, action link. `print="hide"` drops it from the PDF. |
| `Stat` + `StatGrid` | Figures. `StatGrid size="sm"` inside cards, `md` for page strips. `tone="accent"` on the one number that matters most; `tone="positive"` for good news (open work, growth). |
| `Tags` | Plain keyword lists (print-first). For technologies on screen, prefer `Marks`. |
| `Meter` | A labelled level (0–100) with a reading and a one-line note. |
| `SplitBar` | Shares of a whole with a legend. Monochrome ramp; `accentFirst` for the lead share. |
| `Button` | Every button and button-styled link. `variant="primary" | "ghost" | "quiet"`, `size="sm" | "md"`. Passes through `data-*`. |
| `Disclosure` | Detail that should stay in the HTML for parsers but fold on screen and stay out of the PDF. |
| `Marks` | A stack as platform icons (brand marks from `lib/platforms.ts`) in a hairline strip. Names stay real text for parsers; prints as a plain line. Use this, not pills, for technologies. |
| `.ds-link` (class) | Every inline link. The Home underline: faint at rest, draws in on hover, then a light runs along it. Put `.ds-link-host` on a row or card so hovering it triggers its link. `.ds-link--quiet` drops the resting line. Never style links with `text-decoration`. |
| `.ds-pulse` (class) | Any block with a top hairline. A light crosses the rule once as it scrolls in (Base.astro's observer). |
| `CycleText` | Rotating text with the sidebar's glyph decode. Only the default is page text (parsers, screen readers, PDF); the rest is drawn on screen. |

## Rules for a new component

1. **Section spacing is one scale.** Use `--ds-space-section` between top-level sections, `--ds-space-section-sm` between parts inside a page, and `--ds-space-head` from a section title to its content. `Section` and the home page already use them.
1. **Read tokens, never values.** Colors, sizes, spacing, durations come from `--ds-*`. If a value is missing, add a token first.
2. **Scope your styles.** Use the component's `<style>` block. Class names are `ds-<name>` for primitives, a short feature prefix (`eng`, `grp`, `tl`) for feature components. Reach into a child only with `:global(.ds-child)` from the parent that composes it.
3. **Own your print.** Put the component's `@media print` rules inside it. To leave something out of the PDF from outside, set `data-print="hide"`; for PDF-only content, `data-print="only"`.
4. **Props are data, not styling.** Pass `RoleView`, `Metric`, `string[]`. Variants are a small closed set (`variant`, `size`, `tone`).
5. **Write markup an agent can read.** Real headings, `dl` for figures, `time datetime`, and microformats (`h-resume`, `h-event`, `p-name`, `dt-start`) on anything that is a record.
6. **No JS unless it's behavior.** Toggles use native elements (`details`, radio + `:has()`).

## Data for /resume

`content/experience.json` is the record and keeps every original bullet. `content/resume.json` is the editorial layer: one paragraph and the figures per role, with a `source` for each figure. `src/lib/resume.ts` joins them into `ResumeView`, which is all the page renders. An empty `metrics` list renders nothing, so never pad it with estimates.
