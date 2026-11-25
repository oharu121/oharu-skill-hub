# Plan: Add skills sync check, update AWS diagram reference

**Status:** Completed
**Date:** 2026-11-25

## Context

The hub documents skills that live in a separate repository, `oharu121/skills`. The two repos are deliberately kept apart: `gh skill install oharu121/skills <name>` and `npx skills add oharu121/skills/<name>` expect `skills/<name>` at that repo's root, and the hub's pages are original prose rather than generated from `SKILL.md`. Nothing in the build ties a page to the skill it describes, so when a skill changes the hub page silently goes out of date.

That had already happened. `oharu121/skills` commit `e865564` (#12, released in skills v1.7.0) changed how `aws-architecture-diagram` lays out multi-flow diagrams: lanes now stack top to bottom with a dashed horizontal divider whose style turns off arrowheads, cross-lane edges route through a gutter, edges never leave an icon from the bottom, edge labels are moved onto clear segments, step numbers are 14px bold, and API Gateway moved from the Networking palette to Application Integration. The hub's reference page, written a day earlier, still described a dashed vertical divider and listed API Gateway under Networking.

## Approach

The check lives on the hub side and runs on demand, rather than as a GitHub Action in `oharu121/skills` that opens issues here. A hub-side script needs no cross-repo token and no new CI, and the hub's `/release` flow is already the moment its owner looks at the site's state.

Each entry in `src/data/skills.ts` records `syncedAt`: the `oharu121/skills` commit its page was last checked against. `scripts/check-sync.ts` asks the GitHub REST API for the diff from that commit to `main` (`compare/<syncedAt>...main`, one request per distinct `syncedAt`) and marks an entry stale when the diff touches its source path. Only for stale entries does it fetch the path's commit history, to name the commits the page has not caught up with. Recording an explicit commit, instead of comparing dates, keeps the result deterministic and makes "I updated this page" a one-line, reviewable change.

The source path comes from each entry's existing `github` URL. `skills.ts` now exports `repo` and `blobBase`, so the URL format is defined once and the script reuses it.

The first use of the check is the stale `aws-architecture-diagram` reference page, updated in English and Japanese in the same release.

## Changes

1. **`syncedAt` field.** `SkillEntry` gains a required `syncedAt: string`. Every entry is set to `960aa24` (the skills `main` when the hub's pages were last written), except `aws-architecture-diagram`, which moves to `e865564` after its page update. `repo` and a new `blobBase` are exported; `src()` builds on `blobBase`.
2. **`scripts/check-sync.ts`** and `pnpm check:sync`. Runs with Node's native type stripping, no new dependencies. Auth comes from `GITHUB_TOKEN`, `GH_TOKEN`, or `gh auth token`, and falls back to anonymous requests (60/hour per IP). Prints `ok` or `STALE` per entry with the missing commits, then the current skills `main` SHA. Exit 0 in sync, 1 stale, 2 lookup failed.
3. **`/release` wiring.** `patterns/pnpm.md` runs `pnpm check:sync` as a report-only validation step: drift is quoted in the validation result but never blocks a release. Step 0b of `SKILL.md` names it among the checks.
4. **README.** Documents `pnpm check:sync`, adds `syncedAt` to "Adding a new skill page", and adds a "Keeping pages in sync with the skills" section.
5. **`aws-architecture-diagram` reference page (EN + JA).** API Gateway listed under app integration with a note on the dual-palette rule; 14px bold step numbers; new layout rules for edge sides, gutter routing and label placement; lane layout rewritten for stacked lanes with a horizontal, arrowless divider and its style string.

## Files Modified

| File | Change |
| ---- | ------ |
| [scripts/check-sync.ts](https://github.com/oharu121/oharu-skill-hub/blob/main/scripts/check-sync.ts) | New drift check against `oharu121/skills` |
| [src/data/skills.ts](https://github.com/oharu121/oharu-skill-hub/blob/main/src/data/skills.ts) | Required `syncedAt` on every entry; export `repo` and `blobBase` |
| [package.json](https://github.com/oharu121/oharu-skill-hub/blob/main/package.json) | `check:sync` script |
| [.claude/skills/release/patterns/pnpm.md](https://github.com/oharu121/oharu-skill-hub/blob/main/.claude/skills/release/patterns/pnpm.md) | Report-only Source Sync step |
| [.claude/skills/release/SKILL.md](https://github.com/oharu121/oharu-skill-hub/blob/main/.claude/skills/release/SKILL.md) | Step 0b names `check:sync`; allowed-tools entry |
| [README.md](https://github.com/oharu121/oharu-skill-hub/blob/main/README.md) | Command, new-page step, sync section |
| [src/content/docs/skills/aws-architecture-diagram/reference.mdx](https://github.com/oharu121/oharu-skill-hub/blob/main/src/content/docs/skills/aws-architecture-diagram/reference.mdx) | Synced with skills #12 |
| [src/content/docs/ja/skills/aws-architecture-diagram/reference.mdx](https://github.com/oharu121/oharu-skill-hub/blob/main/src/content/docs/ja/skills/aws-architecture-diagram/reference.mdx) | Japanese mirror of the same update |

## Guard Rails

| Scenario | Behavior |
| -------- | -------- |
| Anonymous rate limit exhausted (shared IP) | Uses `gh auth token` when no env token is set; otherwise exits 2 with GitHub's error message |
| `syncedAt` is a typo or a commit not on `main` | Compare returns 404, or `diverged`/`behind`; exits 2 naming the SHA |
| An entry's `github` URL is not under `blobBase` | Exits 2 naming the slug before any request is sent |
| A new entry omits `syncedAt` | `pnpm build` fails on the type, since the field is required |
| Skill path is a prefix of another (`skills/logo` vs `skills/logo-x`) | Matches the exact file or `<path>/` only |
| Drift exists while releasing an unrelated change | `/release` reports it and continues |
| More than 300 files changed since `syncedAt` | GitHub truncates the compare file list; a change beyond it can be missed. Not reachable at this repo's size |
| Path touched, but its commits fall outside the API caps (250 compare commits, 100 history entries) | Still `STALE`: the diff decides staleness, and the page prints `too many commits to list` instead of the commits. Caught in review |
| Node older than 22.18 | `engines.node` in `package.json` declares the requirement for Node's type stripping, and the README says so. Caught in review |

## Verification

1. `pnpm check:sync` prints `All pages in sync.` and exits 0.
2. Temporarily set the `aws-architecture-diagram` `syncedAt` back to `960aa24b9b829526fb980daba8f28726de0d5f9b`: the check prints `STALE aws-architecture-diagram` with `e865564`, and exits 1.
3. Set any `syncedAt` to `deadbeefdeadbeefdeadbeefdeadbeefdeadbeef`: exits 2 with a 404 from the compare endpoint.
4. `node .claude/skills/release/scripts/release-guard.ts locale-parity` and `pnpm build` pass.
5. Open `/skills/aws-architecture-diagram/reference/` and `/ja/skills/aws-architecture-diagram/reference/`: API Gateway sits under app integration, lane layout describes stacked lanes and shows the arrowless divider style.

## Breaking Changes

None for readers. Contributors adding a skill entry must now set `syncedAt`.
