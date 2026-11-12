# Source inventory

Working notes for project pages and the blog backfill. Every fact here was read from a repo file on November 10, 2026. Nothing here is published.

Commit counts and dates come from each repo's `.git/logs/HEAD` (the local reflog), so they cover this machine only. A repo with 0 local commits was cloned, not committed to, here.

## Verified so far

| Project | Path | Stack (from config) | Local history |
| --- | --- | --- | --- |
| GameKal | `~/Web/Concepts/gamekal` | Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6.0, Vercel Functions, Supabase, Storybook 10.6, VitePress 1.6, Mermaid 12, Three.js 0.186, Swift Expo module | 130 commits, September 24 to November 10, 2026. Releases 0.1.0 to 0.1.25. 538 tests. 3 posts in `docs/blog` |
| Zefr | `~/Web/MillerMedia7/zefr-com` | Craft CMS 5.8, PHP 8.4, nginx-fpm, MySQL 8.0 (DDEV), Craft Cloud. Plugins: CKEditor, SEOmatic, Retour, Vite, Neo, Navigation, SAML SP (flipboxfactory) | 77 commits, March 24 to July 17, 2026 |
| AAMI | `~/Web/Taoti/wp/aami-wp` | WordPress on Bedrock, PHP 8.3, Apache 2.4, MySQL 8.0, Redis (Lando). ACF Pro 6.3, ACF Extended, Yoast, WP Rocket 3.20, miniOrange SAML 5.4.3, WP 2FA, Security Audit Log, Taoti Security Scanner. BuddyBoss homepage feed (`HOMEFEED.md`) | 0 local commits |
| Combioh | `~/Web/Concepts/combioh` | Next.js 16.4, React 19.3, Tailwind 3.4, Vitest 4. A Nioh 3 combo trainer, JSON-driven | 50 commits, May 11 to October 17, 2026 |
| Taoti Security Scanner | `~/Web/Taoti/wp/taoti-security-scanner-wp` | WordPress plugin, PHP 8.1+, PHPUnit, WP-CLI, REST API, HMAC-signed webhooks to QA Pulse | Built during a March 2026 incident response. 1.0.4 (April 12), 1.0.5 (April 23), 1.0.6 (September 18), 1.1.0 (October 1, 2026) |
| AppPass Removal | `~/Web/Concepts/apppass-rm-plugin` | Must-use WordPress plugin 2.0.12, disables Application Passwords across REST and XML-RPC | No git log |

## Still to read

- `~/Web/Taoti/wp/*`: 31 more client sites (APTA, Election Center, electionline, PhRMA, NYAM, US Telecom and others), plus `wordpress-ci-repeat` (GitHub workflows and Pantheon) and `wp-statusboard`
- `~/Web/MillerMedia7`: TruBridge (3 repos), alz-org, Pulse GovCon, the apartment sites, and the other Zefr repos
- `~/Web/Ancient/PEPVIZ`, `~/Web/PDA.nyc` (Shopify, ZUGU), `~/Web/Sageworx` (Everpass), `~/Web/Consulting` (cascade-space, echoes-of-history)
- `~/Web/Gaming` (Phaser: retro-fisher, reverse-engineer-anything; Godot)
- `~/Web/Concepts`: deevicee, pawdings, smithing-texts
- `~/Engineering/Projects` and `~/Engineering/Clients` (older work: Angular, Drupal, Laravel, Rehab, Cicada Capital)
- Nioh3Tracker: not found yet. Where does it live?

## Blog backfill: what the sources already support

Weeks run Monday to Sunday, November 2025 to November 2026. Each candidate is listed only where a source above backs it.

| Window | Candidate post | Evidence |
| --- | --- | --- |
| Late March 2026 | Moving Zefr to Craft CMS 5 on Craft Cloud | Zefr commits from March 24; `craft-cloud.yaml` notes on `/dist` rewrites and 500s |
| March 2026 | The week we wrote our own malware scanner | Scanner README: built during a March 2026 incident response |
| April 2026 | Components as content: Zefr's Neo blocks | Zefr commits in April (callouts, resources, module groups) |
| April 2026 | A scanner that fataled outside WP-CLI | Scanner 1.0.5 changelog, April 23 |
| May 2026 | Combioh: a combo trainer in a weekend | Combioh commits from May 11 to 24 |
| May to July 2026 | Termly, SAML and SEOmatic on Zefr | Zefr commits in May; composer plugins |
| September 2026 | When the scanner flagged its own data | Scanner 1.0.6 changelog, September 18 |
| September 24, 2026 | Starting GameKal | First commit |
| October 2026 | Scan history, webhooks and QA Pulse | Scanner 1.1.0, October 1 |
| October 2026 | Turning off Application Passwords site-wide | AppPass Removal README |
| October 2026 | Flags are not languages | Combioh commit, October 14 |
| October to November 2026 | GameKal: performance pass, the 78 MB catalog, BotID retries | GameKal changelog and docs |
| November 10, 2026 | Two names for one temp folder | Existing GameKal post |

There are about 13 candidates so far, against the 52 needed. November 2025 to February 2026 has no source yet. The client folders above should fill it.
