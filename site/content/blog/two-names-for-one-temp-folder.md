---
title: "Two names for one temp folder"
description: "537 passes on a Mac, 538 in Linux. One temp folder with two names, and a one-line fix."
date: 2026-11-12T15:00:00-05:00
visibility: public
tags: [GameKal, Testing, macOS]
---

Run GameKal's test suite on a Mac this evening and you got 537 passes and 1 failure. Run the same suite on the same code in the Linux sandbox my coding agent works in, and all 538 passed. The difference was one folder with two names, and the fix is one line in a test.

The fix is in `server/catalogStore.disk.test.mjs`, and that file's 9 tests now pass on the Mac. The server code didn't change.

This post covers how the failure surfaced, why it only happened on macOS, and the one line that fixed it. It also covers a quieter problem it exposed: four checks in the same file that couldn't fail on a Mac at all.

## A test that watches what the server opens

`server/catalogStore.cjs` answers catalog requests from JSON files under `src/data`. The live file, `releases2026.json`, is 78 MB, so a lot of work has gone into making sure a request opens only the small file it needs ([Locked out by my own fortress](/blog/locked-out-by-our-own-fortress)).

`catalogStore.disk.test.mjs` checks that on real files. It builds a tiny catalog in a temp folder, moves into that folder with `process.chdir`, and wraps `fs.readFileSync` so every read is recorded. Each recorded path is made relative to the test's own `data` folder, so a test can say "this lookup opened `years/2025.json`, not `releases2026.json`."

The store finds its files through `findData`, which starts from `process.cwd()`. Keep that in mind, because it's the whole story.

## November 10: the evening the agent couldn't run tests

All day, the tests ran inside the Linux VM the Claude desktop app runs for its coding agent. All 538 passed, run after run.

That evening, one run came back with 28 failures. After that, every command the agent sent failed before it started:

```text
listen ENOSPC: no space left on device
```

The Mac itself had 558 GB free, so the full disk was the VM's, not mine. Restarting the desktop app didn't clear it.

- **Measured:** the error, the 28 failures in the run before it, and the Mac's free space.
- **Inferred:** the 28 failures came from the VM's disk filling up. All 538 had passed in that same VM all day.
- **Not known:** what filled the disk.

So I ran the suite in my own terminal on the Mac. 537 passed and 1 failed:

```text
✖ an archive id opens its year file, not the live file
  assert.ok(files.includes('years/2025.json'))
```

Run on its own, the file failed the same way every time: 8 of 9.

## One folder, two names

On macOS, `os.tmpdir()` returns a path under `/var/folders/`. But `/var` is a symbolic link to `/private/var`, so both names reach the same folder.

The test made its temp folder with the short name and built `data` from it. Then it called `process.chdir` into the folder. When the store asked `process.cwd()` where it was, macOS answered with the real path, under `/private/var/folders/`. Every read the wrapper recorded used that real path, and `path.relative` from a `/var` folder turned `years/2025.json` into a long `../../private/var/…` path. The server opened the right file. The test just didn't recognise it.

In the sandbox, the temp folder isn't behind a link, so both names were the same and the test passed.

```steps
{
  "title": "Where years/2025.json was recorded",
  "subtitle": "The same test, in the Linux sandbox and on the Mac. Steps in order, not to scale.",
  "rows": [
    {
      "label": "Linux",
      "sublabel": "sandbox",
      "steps": [
        { "title": "Temp folder", "detail": "one name, no link" },
        { "title": "process.cwd()", "detail": "the same name" },
        { "title": "Recorded read", "detail": "years/2025.json" }
      ],
      "caption": "The recorded name matches, and the test passes."
    },
    {
      "label": "macOS",
      "sublabel": "before the fix",
      "steps": [
        { "title": "Temp folder", "detail": "/var/folders/…" },
        { "title": "process.cwd()", "detail": "/private/var/folders/…" },
        { "title": "Recorded read", "detail": "../../private/var/…/years/2025.json" }
      ],
      "caption": "The server reads the right file, but under a name the test doesn't expect."
    },
    {
      "label": "macOS",
      "sublabel": "after the fix",
      "group": { "title": "fs.realpathSync", "detail": "the test starts from the real path" },
      "steps": [
        { "title": "Temp folder", "detail": "/private/var/folders/…" },
        { "title": "Recorded read", "detail": "years/2025.json" }
      ]
    }
  ],
  "note": "From server/catalogStore.disk.test.mjs and findData in server/catalogStore.cjs, November 10, 2026."
}
```

Why did only one check fail? Because it was the only one asking for a file to be there.

## Four checks that couldn't fail

The file makes five claims about what a lookup opened. Four of them are negative: `releases2026.json` wasn't opened (twice), no year file was opened, and a stale month file wasn't read. On a Mac, the recorded list never held a short name like `releases2026.json`, so those four would have passed whatever the server did.

That's the more useful finding. A check that something is missing from a list proves nothing if nothing in the list can ever match. The one positive check is what caught it.

## The change

The test now resolves the temp folder before using it:

```js
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gamekal-store-')));
```

On the Mac, `data`, the recorded reads, and `process.cwd()` now all use the `/private/var` name. Nothing changes on Linux. `findData` was right all along, so the server is untouched.

## Results

- **Measured:** on the Mac, `server/catalogStore.disk.test.mjs` went from 8 of 9 to 9 of 9.
- **Inferred:** the evening's full run on the Mac failed only this test, so the suite should now pass 538 of 538 there. I haven't rerun the full suite on the Mac since the fix.
- **Restored:** the four negative checks compare like with like again, so they can fail when they should.

## What I learned

Looking back, three lessons stand out.

**Run the suite on more than one machine.** It had passed all day in one place. A different machine found the bug within one run.

**A negative check needs a positive partner.** "Not opened" only means something next to a check that the list holds what it should.

**Resolve paths before comparing them.** Temp folders can have two names, and `fs.realpathSync` costs one line.

## What's next?

Rerun the full suite on the Mac to confirm 538 of 538, and look through the other tests that build paths under `os.tmpdir()` for the same pattern.

The server opened the right file the whole time. It took a Mac to show that the test was looking for it under the wrong name.
