# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

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

[v0.2.0]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.2.0
[v0.1.0]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.1.0
