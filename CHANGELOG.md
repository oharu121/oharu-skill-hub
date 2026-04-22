# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[v0.1.0]: https://github.com/oharu121/oharu-skill-hub/releases/tag/v0.1.0
