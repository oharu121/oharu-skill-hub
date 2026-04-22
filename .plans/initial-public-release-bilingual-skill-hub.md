# Plan: Initial public release — bilingual skill hub

**Status:** Completed
**Date:** 2026-04-22

## Context

The `oharu121/skills` repository ships Claude Code skills and Gemini gems, but its README — and the terse agent-facing `SKILL.md` files inside each skill — aren't the right surface for a human user asking "what does this do and how do I use it?". Those files are written for the agent, not for the reader. A human browsing the repo gets a dense list of install commands with no narrative, no screenshots, no "when to use it" guidance, and no cross-links between related skills.

This release creates a dedicated documentation site — modeled on [nextjs.org/docs](https://nextjs.org/docs) in structure and polish — that fills the gap. Hand-written prose, one guide page per skill, with copy-paste install commands, usage examples, and option tables. Bilingual (English + Japanese) from day one because two of the skills (`devio`, `migrate-env-to-1password`) have Japanese-first interaction, and the author's broader audience reads both languages.

## Approach

**Stack.** Astro + Starlight, deployed on Vercel. Astro was picked over raw Next.js because the content is ~95% static markdown — Starlight's built-in sidebar, TOC, i18n, Pagefind search, and hero splash template eliminate weeks of reinventing documentation primitives. Starlight also ships ~0kb JS by default, which matters for a content site that will eventually host screenshots on every skill page. Vercel auto-detects Astro with zero config.

**i18n.** Full Starlight i18n with `defaultLocale: 'root'` (English at `/`, Japanese at `/ja/`) rather than `/en/` + `/ja/` symmetric paths — cleaner URLs for the primary audience and matches Starlight's own docs convention. Every page has a Japanese counterpart written at authoring time, not "later"; this avoids the translation-drift trap where English content grows and Japanese atrophies.

**Single source of truth for skill metadata.** [`src/data/skills.ts`](src/data/skills.ts) holds locale-agnostic structural data (slug, category, install commands, related skills) plus nested per-locale translations (title, tagline). Three locale-aware Astro components (`InstallCommand`, `SkillCard`, `SkillGrid`) read from this file and render correctly in whichever locale the visitor is viewing. Changing an install command convention once — instead of ten times — is the direct payoff.

**Content template.** Each skill page follows a 7-section template (hero + install → What it does → When to use → How it works → Example → Options & modes → Related skills → Source) targeting 350–600 words of prose. Two skills with richer internals (`aws-architecture-diagram`, `release`) get a dedicated Reference sub-page so the main guide stays skimmable. Gem pages are intentionally shorter (~200 words) because gems are fundamentally "paste this prompt into Gemini, done."

## Changes

### Foundation

- Scaffolded Astro + Starlight project via `pnpm create astro@latest -- --template starlight`
- Configured [`astro.config.mjs`](astro.config.mjs): `site: 'https://oharu-skill-hub.vercel.app'`, bilingual `locales` with `defaultLocale: 'root'`, sidebar groups (`Start here` / `Skills` / `Gems`) with translated labels
- Created [`src/data/skills.ts`](src/data/skills.ts) with 10 entries (7 skills + 3 gems), each with `install: { gh, npx, pnpm }`, `related: string[]`, and `i18n: { en, ja }`
- Built three reusable components — [`InstallCommand`](src/components/InstallCommand.astro), [`SkillCard`](src/components/SkillCard.astro), [`SkillGrid`](src/components/SkillGrid.astro) — each reading `Astro.currentLocale`

### Content

- Splash pages at [`src/content/docs/index.mdx`](src/content/docs/index.mdx) and [`src/content/docs/ja/index.mdx`](src/content/docs/ja/index.mdx) with hero + three category-filtered skill grids
- Four "Start here" pages per locale: welcome, installing, gems, conventions
- Seven skill guide pages per locale, plus reference sub-pages for `aws-architecture-diagram` and `release`
- Three gem guide pages per locale
- Total: **39 static pages**

### Repo setup

- Added `.gitignore` additions for `.vercel`, `.claude/`, and editor artifacts
- Replaced Astro scaffold README with project-specific README pointing at the deployed site
- Created public GitHub repo `oharu121/oharu-skill-hub` via `gh repo create --public --source=.`

## Files Modified

| File | Change |
|------|--------|
| [astro.config.mjs](astro.config.mjs) | Configured site URL, i18n locales, sidebar groups with translations, social links |
| [src/data/skills.ts](src/data/skills.ts) | Created single source of truth for all 10 skills and gems |
| [src/components/InstallCommand.astro](src/components/InstallCommand.astro) | Renders gh/npx/pnpm install tabs per skill, locale-aware |
| [src/components/SkillCard.astro](src/components/SkillCard.astro) | LinkCard wrapper reading skill slug + current locale |
| [src/components/SkillGrid.astro](src/components/SkillGrid.astro) | Filters skills by category, renders as Starlight CardGrid |
| [src/content/docs/](src/content/docs/) | 19 English pages (splash, 4 start, 7 skills, 2 references, 3 gems + 2 overviews) |
| [src/content/docs/ja/](src/content/docs/ja/) | 19 Japanese mirror pages with full translations |
| [README.md](README.md) | Replaced scaffold README with project-specific one |
| [.gitignore](.gitignore) | Added `.vercel`, `.claude/`, editor artifacts |

## Guard Rails

| Scenario | Behavior |
|----------|----------|
| Visitor's browser is set to Japanese and lands on `/` | Starlight auto-redirects to `/ja/` via Accept-Language detection |
| Missing Japanese translation for a future page | Starlight falls back to the English version and logs a build warning |
| Skill install command convention changes (e.g., new CLI flag) | Edit [`src/data/skills.ts`](src/data/skills.ts) once — 10+ pages update automatically |
| Broken internal link introduced in a page | `pnpm build` fails; Starlight validates all internal links |
| New skill added to `oharu121/skills` | Add entry to `skills.ts`, create `skills/<slug>.mdx` in both locales, add to sidebar |

## Verification

- `pnpm install && pnpm build` completes without errors and generates 39 static pages
- `pnpm dev` serves the site at http://localhost:4321/ with no console errors
- Locale switcher in the header toggles between English and 日本語
- Every skill page loads in both locales with working install tabs (gh / npx / pnpm)
- Sidebar shows three groups expanded by default with all skills and gems visible
- Pagefind search finds terms like "draw.io", "cost estimate", "release", "bedrock"
- Vercel preview deploys on push to `main` once the GitHub → Vercel integration is connected (deferred to post-release)

## Breaking Changes

None — this is an initial release.
