# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.2.2] — 2026-11-25

### Changed

- The hub is now served at `https://skills.oharu121.com`. Canonical links, the sitemap and the README point at the new host; `oharu-skill-hub.vercel.app` still serves the same site.

## [v0.2.1] — 2026-11-25

### Added

- `pnpm check:sync` lists hub pages whose skill or gem in `oharu121/skills` changed after the page was last updated, naming the commits each page is missing. Each entry in `src/data/skills.ts` records the skills commit it was last checked against as `syncedAt`. The `release` skill runs the check and reports drift without blocking.

### Changed

- The `aws-architecture-diagram` reference page, in English and Japanese, now matches the skill's layout rules from skills #12: stacked lanes with a dashed horizontal divider that draws no arrowheads, edges that never leave an icon from the bottom, gutter routing between rows, edge labels moved onto clear segments, 14px bold step numbers, and API Gateway coloured as Application Integration rather than Networking.

- The `release` skill's `/simplify` step also reviews YAML config, tells files it created apart from another session's untracked files, and stops to ask when shipped code would depend on an edit outside the release.
- The `release` skill now runs the `/simplify` code-cleanup review on the code it ships, and skips it for releases of guide pages and images only. Its command rules are explained by worktree isolation rather than by avoiding permission prompts, which auto mode makes rare.

## [v0.2.0] — 2026-11-24

### Added

- Guide and reference pages for the `logo` skill, in English and Japanese, with screenshots of its concept rounds and 16px contact sheet.
- `logo` card on the Skills landing page and a `logo` group in the sidebar.
- The `release` skill that ships this site is now versioned in the repo under `.claude/skills/release/`.

### Changed

- pnpm build approvals for `esbuild` and `sharp` moved to `pnpm-workspace.yaml`; the ignored `pnpm.onlyBuiltDependencies` field in `package.json` was removed.

## [v0.1.0] — 2026-04-22

### Added

- Initial public release of the Oharu Skill Hub.
- Bilingual documentation site (English + 日本語) built with Astro + Starlight.
- Guides for 7 Claude Code skills (`aws-architecture-diagram`, `aws-cost-estimate`, `bedrock-ops`, `release`, `migrate-env-to-1password`, `generate-bruno-files`, `devio`) including dedicated reference sub-pages for `aws-architecture-diagram` and `release`.
- Guides for 3 Gemini gems (`daily-briefing`, `jp-communication-enhancer`, `thumbnail-generator`).
- Four "Start here" pages: Welcome, Installing skills, Using Gemini Gems, Conventions.
- Splash landing pages with category-filtered skill grids.
- Reusable locale-aware components: `InstallCommand`, `SkillCard`, `SkillGrid`.
- Single source of truth for skill metadata at `src/data/skills.ts` with nested `i18n: { en, ja }` translations.
- Starlight i18n with `defaultLocale: 'root'` — English at `/`, Japanese at `/ja/`.
- Pagefind static search, Starlight sidebar with curated AWS + Workflows sub-groups, automatic TOC per page.

[v0.2.2]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.2.2
[v0.2.1]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.2.1
[v0.2.0]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.2.0
[v0.1.0]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.1.0
