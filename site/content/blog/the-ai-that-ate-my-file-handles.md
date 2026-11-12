---
title: "The AI that ate my file handles"
description: "A Mac said it was out of open files. The cause was the coding agent, and three commands proved it."
date: 2026-11-12T09:00:00-05:00
visibility: public
tags: [GameKal, Debugging, macOS]
---

Run one command on a Mac and get told the whole machine is out of open files. That's what happened the morning I tried to put GameKal's new static catalog on an iPhone. The cause wasn't Node, OpenSSL, or the laptop. It was the coding agent I'd been working with all morning, and it took three commands to prove it.

This post covers the error, the three commands that found the cause, what I know and what I'm only inferring, and what I watch now.

## The morning it happened

It started as a good morning. GameKal's website had just gone from a 20-second Home page to 1.8 seconds by moving the release catalog onto Vercel's CDN ([Locked out by my own fortress](/blog/locked-out-by-our-own-fortress)). The next step was to make the iPhone app read the same files, so I plugged in a phone and ran the usual device build, `npm run ios -- --device`.

It failed before it did anything:

```text
node: OpenSSL configuration error:
80A1D1ED01000000:error:80000017:system library:BIO_new_file:Too many open files in system:crypto/bio/bss_file.c:67:calling fopen(/opt/homebrew/etc/openssl@3/openssl.cnf, rb)
```

Node couldn't open a 10 KB config file. Nothing was wrong with that file. The whole Mac had run out of room to open any file at all.

The timing made it worse. Minutes earlier, the local iOS project had turned out to be a week behind `package.json`, and `pod install` had refused to run. I regenerated the project, and the very next command hit this wall. Two unrelated failures back to back is how you lose an hour, and it's why this one deserved a real diagnosis instead of another guess.

## "In system" is the important part

macOS has two different "too many open files" errors, and they mean very different things:

| Error | Meaning | Usual fix |
| --- | --- | --- |
| `EMFILE`, "Too many open files" | **This process** hit its own limit (`ulimit -n`) | Raise the limit for that shell, or fix a leak in that program |
| `ENFILE`, "Too many open files **in system**" | **The whole machine** hit its limit (`kern.maxfiles`) | Find whoever is holding everything |

Mine said *in system*. Raising `ulimit` would have done nothing. Something on the Mac was holding a huge share of every file handle the kernel allows, and no amount of RAM or CPU raises that ceiling.

## Three commands to find it

```steps
{
  "title": "Three questions, three commands",
  "subtitle": "Steps in order. Each answer pointed to the next question.",
  "rows": [
    {
      "label": "Diagnosis",
      "sublabel": "read-only",
      "steps": [
        {
          "title": "How full is it?",
          "detail": "sysctl: 273,531 of 491,520"
        },
        {
          "title": "Who holds them?",
          "detail": "lsof: two pids, 261,118"
        },
        {
          "title": "What are they?",
          "detail": "ps: two VMs"
        }
      ]
    }
  ]
}
```

**How full is the table?**

```bash
sysctl kern.num_files kern.maxfiles
```

```text
kern.num_files: 273531
kern.maxfiles: 491520
```

```bars
{
  "title": "The Mac's file table",
  "subtitle": "Files open across the whole system, minutes after the failure.",
  "max": 500000,
  "ticks": [
    0,
    100000,
    200000,
    300000,
    400000,
    500000
  ],
  "tickFormat": "k",
  "groups": [
    {
      "label": "Open",
      "sublabel": "kern.num_files",
      "bars": [
        {
          "value": 273531,
          "tone": "accent"
        }
      ]
    },
    {
      "label": "Ceiling",
      "sublabel": "kern.maxfiles",
      "bars": [
        {
          "value": 491520,
          "tone": "muted"
        }
      ]
    }
  ],
  "note": "Read with sysctl on November 10, 2026, after some handles had already been released."
}
```

That's 273,531 files open out of a 491,520 ceiling, measured a few minutes after the failure, once some handles had already been released. More than half the system's table was still in use.

**Who is holding them?**

```bash
lsof -n 2>/dev/null | awk '{print $1, $2}' | sort | uniq -c | sort -rn | head -8
```

```text
191008 com.apple 9482
 70110 com.apple 21217
  2094 phpstorm 55059
   836 Google 586
   711 corespotl 714
   555 LogiPlugi 73940
   363 Cursor 1799
   333 Messages 89938
```

```bars
{
  "title": "Who held the open files",
  "subtitle": "Open files per process, from lsof.",
  "max": 200000,
  "ticks": [
    0,
    50000,
    100000,
    150000,
    200000
  ],
  "tickFormat": "k",
  "groups": [
    {
      "label": "Virtual machine",
      "sublabel": "pid 9482",
      "bars": [
        {
          "value": 191008,
          "tone": "accent"
        }
      ]
    },
    {
      "label": "Virtual machine",
      "sublabel": "pid 21217",
      "bars": [
        {
          "value": 70110,
          "tone": "accent"
        }
      ]
    },
    {
      "label": "PhpStorm",
      "bars": [
        {
          "value": 2094
        }
      ]
    },
    {
      "label": "Chrome",
      "bars": [
        {
          "value": 836
        }
      ]
    },
    {
      "label": "Spotlight",
      "bars": [
        {
          "value": 711
        }
      ]
    },
    {
      "label": "Logi plugin",
      "bars": [
        {
          "value": 555
        }
      ]
    },
    {
      "label": "Cursor",
      "bars": [
        {
          "value": 363
        }
      ]
    },
    {
      "label": "Messages",
      "bars": [
        {
          "value": 333
        }
      ]
    }
  ],
  "note": "lsof -n, grouped by process, November 10, 2026. The two virtual machines held 261,118 between them."
}
```

Everything you'd expect (PhpStorm, Chrome, Spotlight, Messages) held a few hundred to a couple of thousand. Two processes held 261,118 between them, 95% of everything open. `lsof` cuts command names to nine characters, so all I knew so far was "something from Apple."

**What are they?**

```bash
ps -o pid,comm -p 9482,21217
```

```text
  PID COMM
 9482 /System/Library/Frameworks/Virtualization.framework/.../com.apple.Virtualization.VirtualMachine
21217 /System/Library/Frameworks/Virtualization.framework/.../com.apple.Virtualization.VirtualMachine
```

Two virtual machines.

## The culprit was the assistant

These weren't Docker or a forgotten emulator. They were the Linux VMs the Claude desktop app runs on the Mac so a coding agent can work in a shell against a connected folder. The agent I'd been working with that morning was running inside one of them, with the GameKal repository mounted.

Here's what it had been doing:

- **`npm test`**, more than 500 tests across the repo, after nearly every change.
- **`tsc --noEmit`** over the whole project, which reads every type file in `node_modules`.
- **`grep`, `find`, and `ls`** across `src/`, `docs/`, and `src/data/`, where the catalog alone is hundreds of megabytes spread over hundreds of files.
- **Generating about 19,000 static catalog files** to check the new CDN build.

Every one of those reads goes through the VM's shared-folder bridge to the Mac's disk. From what I measured, that bridge kept a handle open on the Mac side for files the guest had touched, and held them well after the command finished. Two VMs suggests an earlier agent session was still alive next to the current one, holding its own pile.

It's worth being precise about what I know and what I don't:

- **Measured:** two `com.apple.Virtualization.VirtualMachine` processes held 191,008 and 70,110 open files, with the system at 273,531 of 491,520 minutes after the failure. Restarting the Claude desktop app released them.
- **Inferred:** the handles came from the agent's own repo-wide reads through the shared folder. I didn't instrument the VM itself. The timing and the agent's command history make it by far the likeliest cause.
- **Not known:** whether the bridge would have released them on its own, or how long that would take.

## The fix

Quit and reopen the Claude desktop app. That ends its VMs, and the kernel releases everything they held.

The next `npm run ios -- --device` built, installed, and launched on the phone, and the Metro log showed the app booting and reading the new static catalog files from the Mac:

```text
iOS Bundled 793ms App.tsx (1662 modules)
 LOG  boot enter +1243ms
 LOG  catalog ok 246ms http://192.168.50.188:8787/data/34407b86f368/day/2026-11-10.json
```

From the first error to the right answer took three commands, because I asked the machine for measurements before guessing at a cause.

## Why this is easy to miss

Nothing about it looked like an AI problem.

**The error names Node and OpenSSL.** Neither was involved.

**Activity Monitor shows CPU and memory, not file handles.** The VMs looked idle.

**The failure lands on whatever runs next.** Here it was a build, but it could as easily have been Xcode, a browser tab, or a backup. The program that breaks is rarely the program that caused it.

**Agents are thorough on purpose.** Running the full test suite after every change is good practice for correctness. It's also the most file-hungry thing you can do in a big repo.

## What I watch now

**A one-line health check.** Run it after a long agent session, or whenever a tool fails with a strange file error:

```bash
sysctl -n kern.num_files kern.maxfiles | paste -sd' ' - | awk '{printf "open files: %d of %d (%.0f%%)\n", $1, $2, 100*$1/$2}'
```

Under 20% is normal for a busy developer Mac. Over 50% means it's time to find the holder before it finds you.

**The top holders, with their full names**, instead of `lsof`'s nine-character cut:

```bash
lsof -n 2>/dev/null | awk 'NR>1 {print $2}' | sort | uniq -c | sort -rn | head -5 \
  | while read count pid; do printf "%7d  %s\n" "$count" "$(ps -o comm= -p "$pid" | xargs basename)"; done
```

**Changes on the agent side:**

- Full test and type-check runs happen once per finished change, not after every edit. While working on one file, its own tests are enough.
- Finished agent sessions get closed, and the desktop app gets restarted after a long day of agent work.
- Repo-wide `find` and `grep` are scoped to the folders that matter, never `node_modules` or the 600 MB catalog.

**Report it.** A bridge that keeps hundreds of thousands of handles open after the reads are done is a product bug, not a usage mistake. If you hit it, send the numbers above with the thumbs-down feedback in the Claude app.

## What I learned

**The program that fails is rarely the program at fault.** The error pointed at Node and OpenSSL. The cause was a tool that wasn't even on the screen.

**Measure before you guess.** Three read-only commands turned "something is wrong with the Mac" into two process ids and a name.

**Say what you know and what you're inferring.** I measured the handles and the processes. I inferred the cause. Keeping those apart is what makes the report useful to the people who can fix the bridge.

I'd spent the previous month learning that GameKal's own design choices were the root of problems I kept patching one symptom at a time. This was the same lesson in miniature. If your Mac starts acting strangely during a day of AI-assisted coding, check the file table before you blame the laptop.
