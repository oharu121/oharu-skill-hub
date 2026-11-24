# Plan: Add logo skill guide

**Status:** Completed
**Date:** 2026-11-24

## Context

The `logo` skill in `oharu121/skills` had no page on the hub. It is a workflow skill that designs a mark through a reference study, generated concept rounds, and a contact sheet that renders every candidate at 16px. Its central argument — that asking a model for "range" yields twenty-four versions of one monoline logo, and that a reference study is what breaks that — only lands when the reader sees the before/after rounds side by side, so the guide needed real screenshots, not a description.

Two pieces of repo housekeeping were also sitting uncommitted. `pnpm-workspace.yaml` held pnpm's unanswered build-approval placeholders (`esbuild: set this to true or false`), left by an interrupted `pnpm install`. And the `release` skill that ships changes to this site lived only in the local `.claude/` directory, which `.gitignore` excluded wholesale, so it was not versioned with the repo it operates on.

## Approach

The guide follows the existing split-page pattern used by `aws-architecture-diagram` and `release`: an `index.mdx` narrative guide plus a `reference.mdx` sub-page, mirrored under `ja/`. Screenshots live in `src/assets/skills/logo/` and are imported through `astro:assets` so Astro optimizes them to WebP at build time, matching how `aws-architecture-diagram` handles its images.

Skill metadata goes into `src/data/skills.ts`, the single source of truth that drives the skill grid and install commands, so the card and the `InstallCommand` component pick up the `logo` slug with no component changes.

For pnpm, both `esbuild` and `sharp` are approved: Astro needs `esbuild` to bundle and `sharp` to optimize the new PNGs. For the release skill, `.gitignore` is narrowed from ignoring `.claude/` entirely to ignoring everything under it except `.claude/skills/release/`, so locally installed skills and settings stay private.

## Changes

1. **Sidebar** — `astro.config.mjs` gains a `logo` group under Workflows with `Guide` (`skills/logo`) and `Reference` (`skills/logo/reference`) entries, with Japanese labels `ガイド` / `リファレンス`.
2. **Metadata** — `src/data/skills.ts` adds a `logo` entry: `category: 'workflow'`, `status: 'stable'`, `gh`/`npx`/`pnpm` install commands, `related: ['thumbnail-generator', 'release']`, and EN/JA title and tagline.
3. **Pages** — `src/content/docs/skills/logo/index.mdx` and `reference.mdx`, plus Japanese mirrors under `src/content/docs/ja/skills/logo/`.
4. **Assets** — four screenshots in `src/assets/skills/logo/`: `round-1-icons.png`, `round-2-concepts.png`, `round-3-hanko-16px.png`, `broken-u.png`.
5. **pnpm** — `pnpm-workspace.yaml` sets `allowBuilds.esbuild: true` and `allowBuilds.sharp: true`. The old `pnpm.onlyBuiltDependencies` field in `package.json` is removed: current pnpm no longer reads it and warns on every build.
6. **Release skill** — `.gitignore` re-includes `.claude/skills/release/`; the skill (`SKILL.md`, `patterns/pnpm.md`, `review-checklist.md`, `scripts/release-guard.ts`, `templates/*.md`) is committed.
7. **Docs** — README skill count and CHANGELOG `v0.2.0` entry.

## Files Modified

| File | Change |
| ---- | ------ |
| [astro.config.mjs](https://github.com/oharu121/oharu-skill-hub/blob/main/astro.config.mjs) | `logo` sidebar group with Guide and Reference |
| [src/data/skills.ts](https://github.com/oharu121/oharu-skill-hub/blob/main/src/data/skills.ts) | `logo` skill entry |
| [src/content/docs/skills/logo/index.mdx](https://github.com/oharu121/oharu-skill-hub/blob/main/src/content/docs/skills/logo/index.mdx) | English guide |
| [src/content/docs/skills/logo/reference.mdx](https://github.com/oharu121/oharu-skill-hub/blob/main/src/content/docs/skills/logo/reference.mdx) | English reference |
| [src/content/docs/ja/skills/logo/index.mdx](https://github.com/oharu121/oharu-skill-hub/blob/main/src/content/docs/ja/skills/logo/index.mdx) | Japanese guide |
| [src/content/docs/ja/skills/logo/reference.mdx](https://github.com/oharu121/oharu-skill-hub/blob/main/src/content/docs/ja/skills/logo/reference.mdx) | Japanese reference |
| [src/assets/skills/logo/](https://github.com/oharu121/oharu-skill-hub/blob/main/src/assets/skills/logo/) | Four concept-round screenshots |
| [pnpm-workspace.yaml](https://github.com/oharu121/oharu-skill-hub/blob/main/pnpm-workspace.yaml) | Approve `esbuild` and `sharp` builds |
| [package.json](https://github.com/oharu121/oharu-skill-hub/blob/main/package.json) | Drop ignored `pnpm.onlyBuiltDependencies`; version 0.2.0 |
| [.gitignore](https://github.com/oharu121/oharu-skill-hub/blob/main/.gitignore) | Track `.claude/skills/release/` only |
| [.claude/skills/release/](https://github.com/oharu121/oharu-skill-hub/blob/main/.claude/skills/release/) | Release skill, now versioned |
| [README.md](https://github.com/oharu121/oharu-skill-hub/blob/main/README.md) | Skill count 7 → 8 |
| [CHANGELOG.md](https://github.com/oharu121/oharu-skill-hub/blob/main/CHANGELOG.md) | `v0.2.0` entry |

## Guard Rails

| Scenario | Behavior |
| -------- | -------- |
| English page added without a Japanese mirror | `release-guard.ts locale-parity` fails the release |
| Sidebar slug points at a missing page | `astro build` fails |
| `sharp` build not approved on a fresh clone | `pnpm install` would skip the native build; `allowBuilds.sharp: true` prevents it |
| A personal skill or settings file appears under `.claude/` | Still ignored; only `.claude/skills/release/` is re-included |

## Verification

1. `node .claude/skills/release/scripts/release-guard.ts locale-parity` passes.
2. `pnpm build` completes and lists `/skills/logo/`, `/skills/logo/reference/`, `/ja/skills/logo/`, `/ja/skills/logo/reference/`.
3. On the Vercel preview, open `/skills/logo/` and `/ja/skills/logo/`: all four images render, the sidebar shows the `logo` group, and the skills grid shows a `logo` card.
4. `git check-ignore .claude/settings.local.json` still reports it ignored.

## Breaking Changes

None
