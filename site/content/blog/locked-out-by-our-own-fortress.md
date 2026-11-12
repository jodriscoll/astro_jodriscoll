---
title: "Locked out by my own fortress"
description: "GameKal's Home page went from about 20 seconds to 1.8 by serving a public catalog as files instead of guarding every read."
date: 2026-11-11
visibility: public
tags: [GameKal, Performance, Infrastructure]
---

For most of October, GameKal's Home page took about 20 seconds to show the day's releases. Today it shows them in 1.8. Nothing about the data changed. It's the same catalog of 147,000 games, public, read-only, and the same for everyone who asks for it. What changed is how I serve it.

I had built that catalog like a vault. Every read went through a bot check, then a serverless function that wasn't allowed to cache anything, carrying the entire catalog inside it. Each of those choices was made to protect the data, and together they made a public calendar behave like a bank login.

This post covers how I got there, the evening audit and the cold morning that finally showed me the cause, and how I moved the catalog onto Vercel's CDN. It also covers what happened when the iPhone app switched to the same files and somehow didn't feel any faster.

## What I was guarding

GameKal is a game release calendar: an Expo app on iOS, Android, and the web, plus a desktop site at gamekal.com. Under it sits a catalog of about 147,000 titles:

- a live file for 2026 and 2027, `releases2026.json`, at 78 MB
- 32 year files back to 1998, about 352 MB together
- `gridArt.json`, 18 MB of cover art

Every visitor sees the same data. Nobody's calendar day is different from anyone else's. Keep that in mind, because it's the detail I managed to ignore for a month.

## Three decisions that looked sensible

**Bot protection on every read.** Every catalog request went through Vercel BotID before a byte was served (`server/human.cjs`). The goal was to make scraping it hard.

**Never cache.** The very first line of the handler told every cache, including the browser and Vercel's own CDN, not to keep the response:

```js
res.setHeader('Cache-Control', 'private, no-store');
```

Combined with the bot check, that meant every request from every visitor ran a function.

**The whole catalog inside the function.** `vercel.json` bundled the live file, the cover art, and every year file into `api/releases.js`. That's a 640 MB function, large enough that it needs `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` just to deploy. A cold instance began each life by parsing tens of megabytes of JSON.

```steps
{
  "title": "Work before the day's games appear",
  "subtitle": "The website's path for one calendar day. Steps in order, not to scale.",
  "rows": [
    {
      "label": "Before",
      "sublabel": "every request",
      "steps": [
        {
          "title": "Bot check",
          "detail": "BotID"
        },
        {
          "title": "/api/releases",
          "detail": "private, no-store"
        },
        {
          "title": "Cold start",
          "detail": "parse tens of MB"
        },
        {
          "title": "Day's cards",
          "detail": "JSON answer"
        }
      ],
      "caption": "Every request from every visitor ran the function, and nothing along the way was allowed to keep the answer."
    },
    {
      "label": "Now",
      "sublabel": "a file",
      "group": {
        "title": "Vercel CDN",
        "detail": "cached under a stamp"
      },
      "steps": [
        {
          "title": "current.json",
          "detail": "the stamp"
        },
        {
          "title": "Day file",
          "detail": "/data/<stamp>/day/…"
        }
      ],
      "caption": "No function runs. On a second visit the day file comes from the browser's disk cache.",
      "aside": "Picks, Similar Games, and search still run a function, /api/compute, and the CDN keeps each answer for a day."
    }
  ],
  "note": "Simplified. Phone builds through 0.1.24 still take the old path."
}
```

None of these was careless. Each one solved a real problem on the day it was written. The trouble only shows up when you stack them.

## A month of patching symptoms

For about a month, every complaint got a local fix: a loader here, a smaller request there, a retry somewhere else. Home kept taking about 20 seconds, and a game page 8 seconds or more.

The `no-store` line sat at the top of a file I edited over and over. Nobody asked why public data was going through a function at all.

## November 9: the audit

One evening I read every request each page made, in order, and found real waste:

- **A game page opened from its address also loaded Home underneath it**, with Home's whole week, its cards, its picks, and its searches. Home now waits until it's actually shown.
- **Shelf-wide work ran on every view.** Every shelf card was refreshed and every wishlist title searched, on pages that showed neither. Both now run only where they're seen, and wishlist titles are searched at most once a week.
- **Two views asking for the same game sent two requests.** Card answers are now shared by game id for ten minutes.
- **A 429 was retried straight back into the rate limit,** which kept the limit closed. The client now honors `Retry-After`.

Then I found the one that hurt most. Two tiny data fixes, a Steam page for one game and a working cover for another, grew `releases2026.json` from 78,026,296 bytes to 78,026,355. Every index carries a stamp built from file sizes, so 59 extra bytes made all of them look stale. The API quietly fell back to parsing the full 78 MB file on every request, at 5 to 8 seconds each, and picks returned 503. The deploy had gone out without rebuilding the indexes, and nothing stopped it.

The fix had two parts: rebuild the indexes, then make the content editor refuse to deploy a stale one (`requireFreshIndex`, checked before and after it syncs the catalog).

After that evening's deploy, Home loaded in 4.62 seconds, then 3.64 on a second visit. Days took 200 to 460 ms each, picks answered in 193 ms instead of failing, and a game page took about 1.5 seconds.

Better. But every read still ran a function.

## November 10, 8 a.m.: the cold morning

The first load the next morning sat for about 50 seconds. One card request returned a 500 after 4.14 seconds, and the counts request stayed pending for 85. On Home, every request was cut off at about 8 seconds, sent again, and cut off again, for about five rounds.

Here's what was happening. The client gave up on any request after 8 seconds and sent it again, but the first request kept running on the server. With Fluid compute, many requests share one Node instance. That's a great deal when requests spend their time waiting on the network, and a bad one when they spend it parsing JSON. Each resend queued behind the one before it until the instance was buried.

Why hadn't I seen it the night before? Every one of those tests ran right after a deploy, on warm instances.

The quick fix was to wait instead of resending: 45 seconds for catalog requests, 30 for search, and one shared request per URL. The real lesson was obvious by then. This data should never have needed a function.

## Public data belongs on a CDN

Store sites serve this kind of data as files from their CDN. In a comparison screenshot, Epic's store home finished in 1.23 seconds. I planned the move in three stages that could each ship on its own.

```before-after
{
  "title": "Every read ran a function. Now most reads are files.",
  "subtitle": "What answers each catalog request on gamekal.com, before the move and since 10 November 2026.",
  "panels": [
    {
      "label": "Before",
      "caption": "One function answered every read, and nothing could be cached.",
      "metric": "Home: about 20 s",
      "target": {
        "icon": "database",
        "title": "The whole catalog",
        "detail": "640 MB in the bundle, parsed on a cold start"
      },
      "lanes": [
        {
          "from": {
            "icon": "user",
            "title": "People",
            "detail": "web, iOS and Android"
          },
          "group": {
            "title": "/api/releases",
            "detail": "BotID on every read, then private, no-store",
            "target": true
          },
          "to": [
            {
              "title": "Days and counts",
              "detail": "the calendar and Release Statistics"
            },
            {
              "title": "Game pages and cards",
              "detail": "one game, or a shelf of them"
            },
            {
              "title": "Picks, Similar Games, search",
              "detail": "depend on the person or the query"
            }
          ]
        }
      ]
    },
    {
      "label": "Since 10 November",
      "caption": "Public data is files on the CDN. Only what has to be computed runs a function.",
      "metric": "Home: 1.81 s",
      "target": {
        "icon": "database",
        "title": "Three indexes",
        "detail": "about 35 MB in the bundle"
      },
      "lanes": [
        {
          "from": {
            "icon": "user",
            "title": "People",
            "detail": "days, counts and games"
          },
          "group": {
            "title": "Vercel CDN",
            "detail": "built at deploy, cached forever under a stamp",
            "variant": "accent"
          },
          "to": [
            {
              "icon": "file",
              "title": "/data/current.json",
              "detail": "the stamp, rechecked on each load"
            },
            {
              "icon": "file",
              "title": "Day and count files",
              "detail": "/data/<stamp>/day and /counts"
            },
            {
              "icon": "file",
              "title": "Game bucket files",
              "detail": "8,192 buckets, about 10 KB each"
            }
          ]
        },
        {
          "from": {
            "icon": "user",
            "title": "People",
            "detail": "picks, Similar Games, search"
          },
          "to": [
            {
              "icon": "cpu",
              "title": "/api/compute",
              "detail": "answers cached at the CDN for a day",
              "variant": "accent"
            }
          ],
          "target": true
        }
      ]
    }
  ],
  "note": "Simplified. Arrows show what answers each kind of request. Home times are on gamekal.com, 9 and 10 November 2026."
}
```

### Stage 1: days and counts as files

`npm run build:web` now ends by writing the catalog into the site's output as static files:

| Path | Holds |
| --- | --- |
| `/data/current.json` | The catalog's stamp, sync time, totals, years, and first and last day |
| `/data/<stamp>/day/2026-11-10.json` | That day's cards |
| `/data/<stamp>/counts/2026.json` | Release Statistics for every "today" in the year |

The stamp is a short hash of the index stamp, so a new catalog gets new paths. That lets everything under a stamp be cached forever. Only `current.json` is ever checked again.

The files are built during the Vercel build, from data the deploy already uploads, so the upload (roughly 670 MB of the CLI's 1 GB limit) doesn't grow. A stale index fails the build. In the browser, a 404 means a deploy replaced the stamp, so the client asks for `current.json` again and retries. Any other failure falls back to the API.

### Stage 2: every game as a file

There are 147,000 games, which is too many for a file each. Instead, every game id hashes (FNV-1a) into one of 8,192 bucket files, and the server and the browser share the same function, `gameBucket`. A game page fetches one file of about 10 KB. Shelf cards are cut from the same records with `cardOf`, the function the API uses, and a test compares every game's file against the API's answer.

### Stage 3: a small function for what has to be computed

Picks, Similar Games, and title search depend on the person or the query, so they can't be files. They moved to `/api/compute`, which carries only the three indexes it reads: about 35 MB instead of 640. Since it doesn't have the catalog files, it can't compute the stamp from their sizes, so it trusts the stamp written inside the search index.

A successful answer is cached at the CDN for a day. The same game's Similar Games comes back without running anything.

## What I kept

Moving to files didn't mean giving up on protection. It meant putting it where it belongs.

- **The functions are still guarded.** `/api/compute`, `/api/releases`, wishlist import, and reports all still check who's asking: BotID for the website, and a signed header for the apps.
- **The rate limits stayed.** They now sit in front of the work that actually costs something.
- **`/api/releases` still answers.** Phone builds through 0.1.24 call it for everything, so it keeps its full catalog until those builds are gone.

What I dropped is the idea that a public, identical-for-everyone catalog needed a vault at all.

## Results on gamekal.com

```bars
{
  "title": "Time until the page finished",
  "subtitle": "gamekal.com before the audit, after it, and on the CDN. Lower is better.",
  "unit": "s",
  "max": 20,
  "ticks": [
    0,
    5,
    10,
    15,
    20
  ],
  "legend": [
    {
      "label": "Nov 9, before",
      "tone": "muted"
    },
    {
      "label": "Nov 9, after the audit",
      "tone": "light"
    },
    {
      "label": "Nov 10, on the CDN",
      "tone": "accent"
    }
  ],
  "groups": [
    {
      "label": "Home",
      "bars": [
        {
          "value": 20,
          "display": "~20 s",
          "tone": "muted",
          "label": "before"
        },
        {
          "value": 4.62,
          "display": "3.64–4.62 s",
          "tone": "light",
          "dots": [
            3.64,
            4.62
          ],
          "label": "after the audit"
        },
        {
          "value": 1.81,
          "display": "1.81 s",
          "tone": "accent",
          "label": "on the CDN"
        }
      ]
    },
    {
      "label": "Game page",
      "bars": [
        {
          "value": 8,
          "display": "8 s+",
          "tone": "muted",
          "label": "before"
        },
        {
          "value": 6.04,
          "display": "1.5–6.04 s",
          "tone": "light",
          "dots": [
            1.5,
            6.04
          ],
          "label": "after the audit"
        },
        {
          "value": 2.28,
          "display": "2.28 s",
          "tone": "accent",
          "label": "on the CDN"
        }
      ]
    },
    {
      "label": "Similar Games",
      "bars": [
        {
          "value": 4.75,
          "display": "0.19–4.75 s",
          "tone": "light",
          "dots": [
            0.189,
            4.75
          ],
          "label": "after the audit"
        },
        {
          "value": 0.05,
          "display": "50 ms",
          "tone": "accent",
          "label": "on the CDN"
        }
      ]
    }
  ],
  "note": "Measured on gamekal.com, November 9 and 10, 2026.\nAfter the audit, dots mark a warm and a cold load. Home's are its second and first visit."
}
```

On the CDN, Calendar finished in 1.50 seconds, Journal in 1.33, and Up Next in 1.52.

On a second visit, every day and game file came from the browser's disk cache in 3 to 9 ms. None of these pages calls `/api/releases` any more.

These were measured on gamekal.com on November 9 and 10, not in a lab, so real devices and networks will vary. The shape of the difference comes straight from the architecture, though: a file on a CDN doesn't have a cold start.

## Then the phone said otherwise

The iPhone app switched to the same files and I tested it on a development build. It didn't feel faster, and taps on the menu went missing.

The network wasn't the problem any more. A 15 KB day file arrived in 50 ms. Something on the phone itself was blocking the thread that handles taps.

A tiny watchdog made it visible. It ticks every 100 ms and logs whenever a tick arrives late (`src/lib/tabSwitchTrace.ts`, development builds only). The first runs logged freezes of 5.8 seconds on Home and 4.7 on Calendar. A 41-second Hermes CPU profile from the phone showed where the time went:

- **8.3 of 26 busy seconds were in `matchWishlistCatalog`.** Every catalog change compared each wishlist game on the shelf with every loaded store link, and built two `URL` objects for each comparison. On the phone, `URL` is a slow JavaScript polyfill. Desktop browsers have it built in, which is why the website never showed it. The fix is a one-regex link reader, tested side by side against `new URL`, plus an index built once per catalog list.
- **1,411 redraws came from animation listeners.** A shine on the "Out Today!" label and a breathing glow on today's card were redrawn from JavaScript every frame, on every tab kept alive in the background. Both now run on the UI thread with Reanimated, and only on the visible tab. The glow's blurred halo no longer pulses, because animating a blur every frame froze iOS's own UI thread instead.
- **A swipe on the menu ate taps.** It kicked in after 8 points of finger drift, cancelled the tap, and then only switched tabs on a long swipe. I removed it.
- **Smaller things added up.** Home re-ranked every loaded game for picks on each shelf change, an Activity row could be skipped after a tab switch, and Calendar kept five heavy months drawn instead of three.

```timeline
{
  "title": "Opening a tab on the iPhone",
  "subtitle": "First open on a development build, before and after the fixes. Lower is better.",
  "unit": "ms",
  "max": 1600,
  "ticks": [
    0,
    400,
    800,
    1200,
    1600
  ],
  "rows": [
    {
      "label": "Journal",
      "sublabel": "before",
      "segments": [
        {
          "from": 0,
          "to": 805,
          "label": "Opening",
          "tone": "dim"
        },
        {
          "from": 805,
          "to": 1573,
          "label": "Frozen",
          "tone": "muted"
        }
      ],
      "marks": [
        {
          "at": 805,
          "label": "805 ms"
        },
        {
          "at": 1573,
          "label": "+768 ms"
        }
      ]
    },
    {
      "label": "Journal",
      "sublabel": "after",
      "segments": [
        {
          "from": 0,
          "to": 169,
          "tone": "accent"
        }
      ],
      "marks": [
        {
          "at": 169,
          "label": "169 ms"
        }
      ]
    },
    {
      "label": "Up Next",
      "sublabel": "before",
      "segments": [
        {
          "from": 0,
          "to": 716,
          "label": "Opening",
          "tone": "dim"
        },
        {
          "from": 716,
          "to": 1495,
          "label": "Frozen",
          "tone": "muted"
        }
      ],
      "marks": [
        {
          "at": 716,
          "label": "716 ms"
        },
        {
          "at": 1495,
          "label": "+779 ms"
        }
      ]
    },
    {
      "label": "Up Next",
      "sublabel": "after",
      "segments": [
        {
          "from": 0,
          "to": 95,
          "tone": "accent"
        }
      ],
      "marks": [
        {
          "at": 95,
          "label": "95 ms"
        }
      ]
    }
  ],
  "note": "iPhone, development build, November 10, 2026. The open and the freeze the watchdog logged, shown back to back."
}
```

The freeze after today's games load went from 5.8 seconds to about 0.9. Switching tabs afterwards went from 90 to 125 ms, with taps lost, to 36 to 75 ms, with every tap landing.

All of this shipped in 0.1.25.

## What it costs

Static files use CDN requests and bandwidth, which the old API requests already used, so the move removes function time without adding much. The new cost is storage: about 0.55 GB of catalog files in each deployment Vercel keeps, at $0.10 per GB-month past the included 10 GB. That's roughly $0.10 a month at most, against a 640 MB function bundle that shrinks once old phone builds are gone. Every service and meter is tracked in Cost Analysis.

## What I learned

Looking back, four lessons stand out.

**Ask what the data is before deciding how to protect it.** Public, read-only, and the same for everyone is a file on a CDN, not a function behind a bot check.

**One line can outweigh a month of optimizations.** The `no-store` header sat above everything I tuned. Read the first lines of the hottest handler before tuning anything below them.

**Test cold, not just warm.** Every number from the night of the audit came from a freshly deployed instance. The morning was the real test.

**Measure the phone on the phone.** The same JavaScript that's instant in a desktop browser can cost seconds in the phone's engine, and a profile finds it faster than any amount of guessing.

## What's next?

Two first-draw freezes remain on the phone: Calendar at about 1.5 seconds and Home at about 0.9. They're the next job. Once installed builds through 0.1.24 are gone, `/api/releases` can drop its 640 MB bundle.

The catalog was never a secret. It was the same for everyone all along, and now it's served that way.
