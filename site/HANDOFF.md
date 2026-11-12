# Handoff: jodriscoll.com (Nov 11, 2026)

Paste this into a new agent session to pick up where the last one stopped.

## 1. Where things are

- **Site source:** `/Users/joey/Engineering/Projects/Personal/jodriscoll.com/site` (Astro 7, static, Vercel adapter, Node pinned to 24 via `package.json` engines and `.nvmrc`).
- The repo root also holds the old 2023 Angular portfolio in `src/`. Don't touch it.
- Project docs in the claude.ai project "Personal Site": `claude/START-HERE.md` (architecture and rules, read it first), `claude/blog-style.md` (voice and dates), `claude/project-inventory.md`, `claude/resume-design-system.md`.
- Before you start: request folder access to the `site` path, then run `npm run dev` and `npm run build` to confirm a clean state.

## 2. Rules Joey has set (don't break these)

- **No regressions.** Re-read a file right before writing it. Several agents edit this site, and stale copies have overwritten newer work (Base.astro, Group.astro, timeline.ts, experience.json).
- **Don't add things he didn't ask for.** He removed CLI path lines and a `$ git log` header he never requested.
- **No border-radius** on panels, cards or boxes. Only buttons, pills, dots and status circles are round.
- **Title Case button labels** ("See the Work", "Start a Conversation", "Read the Case Study").
- **Voice:** "I", never "we/our/us", except when describing team work on a specific project.
- **External links** open in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Never guess versions or figures.** Versions come from real lockfiles. Measured results go in a spec's `outcomes`. Figures Joey states carry `source: "Joey O'Driscoll, stated <date>"`.
- **Font:** JetBrains Mono Variable (`--mono` in `global.css`, `<link>` in `Base.astro`).
- `experience.json` uses **2-space indentation**; keep it that way so diffs stay clean.

## 3. Career facts that are easy to get wrong

- Born 1984 (`src/lib/timeline.ts` `BORN_YEAR`).
- **Nomadic Digital dates from January 2016** (first client LightingAndSupplies.com, near the end of Jellyfish). It ran on the side through Jellyfish and Mindgrub, and full time since May 2023.
- **Mindgrub appears twice:**
  - Senior Software Engineer, full time, Aug 2017 to Jan 2022.
  - Managed Services Consultant, a contract under Nomadic Digital, Jan to Jun 2022 (`mindgrub-managed-services`). It is the only ended engagement, so its card shows a muted "Concluded" status.
- Spec `kind` is the agency name alone ("Taoti Creative", "Mindgrub Technologies"). Never prefix it with "via".
- Resume "Work" lists:
  - Taoti: AAMI, Election Center, IWF.
  - PDA.nyc: ZUGU.
  - Sageworx: EverPass.com (external link).
- Taoti figures:
  - 30+ Web apps serviced
  - 10+ Web apps helped launch
  - 1M+ Lines of code committed
  - 4 Hosting platforms

## 4. What was done recently (verify in the browser)

**Resume (`src/pages/resume.astro`, `src/components/resume/*`):**
- Floating Download PDF button at the bottom right.
- Larger platform icons.
- "Read the Case Study" button at the top right of the showcase card.
- "Full record" removed.
- Engagements are an alternating vertical timeline, **newest first** (`Group.astro` `.tl`):
  - At the top: "Today" with a blinking cursor, a line reading "Nov 2026 · Age 42 · 7 engagements since 2022", and a pulsing green beacon. The month refreshes in the browser.
  - The dashed line starts at the beacon and stops at the oldest engagement's dot. Script sets `--tl-top` and `--tl-bottom`.
  - A sticky chip on the spine reads **"Age N"**, counting back as you scroll.
  - Ancient LLC is at the top, the Mindgrub contract at the bottom. Ancient's stack lists Drupal first.

**Resume showcase (`Showcase.astro`):**
- The featured project is GameKal (`content/resume.json` groups.nomadic-digital.feature).
- Showcases are opt-in per project: a spec's optional `showcase` block (six `steps` with name, figure and detail, plus `facts` labels for the foot) overrides `delivery.steps`. Only `gamekal.json` has one. Every figure in it comes from the spec's own facts and highlights.
- Stages are joined by short connectors that stop clear of each node and fill one by one.
- The description runs the card's width, up to the button.

**Project pages (`src/pages/things-built/[slug].astro`, `src/styles/case.css`):**
- 1440px layout.
- Facts dashboard and Notes tab explorer (auto-advances every 10s, fixed height).
- "How it ships" terminal run with a segmented progress bar and a red check.
- One stage image viewer inside the browser-chrome frame.
- Descriptions auto-link technologies through `src/lib/prose.ts` `enrich()`.
- Brand icons come from `src/lib/platforms.ts` `TOOL_MARKS`.

**Blog (`src/pages/blog/[slug].astro`):**
- "Written date" rail.
- Scrollspy "In this post" table of contents.
- Heading anchor copy links.
- Pipedream-style code tabs (fence `title="…"`).
- Extended BlogPosting JSON-LD.
- Posts spread one per month.

## 5. Open items

1. **Version sweep.** Pull real versions (Node, npm, Sass, libraries) into every project spec from lockfiles under `~/Web` and `~/Engineering`. Only Fisher of Fire is done. The last session couldn't run a shell on the Mac (`device_bash` failed all session), which blocked this.
2. **About 80 stack items have no icon.** Ghidra has none available.
3. **Questions for Joey that are still unanswered:**
   - "Open to Work" or "Ready to Work" badge wording.
   - Whether Taoti gets the leadership bar in NomadicNow.
   - The "This decade" footer heading.
   - Blog body dates that don't match front matter dates.
   - The Fisher of Fire dek says PlayStation 1997, but the port is from the PSP version.
   - GameKal search figures were measured on 133,363 titles, against 147,000 scraped.
4. **Commit the work.** Run `npm run build` first. Several sessions of changes are uncommitted.

## 6. Working notes

- Test UI changes in a real browser at desktop and narrow (≤860px) widths before calling them done.
- `.term` is taken by `CycleText` in `global.css`. Check for class-name collisions before naming new blocks.
- **File-transfer gotcha:** when committing files back to the Mac from a staged copy, reusing the same output filename has pushed an older copy. Commit from a new filename each time (for example `Group-v3.astro`), then re-stage and compare byte sizes to confirm the disk has what you wrote.
- If the dev server shows odd errors after many edits, restart `npm run dev` first.
