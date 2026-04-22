# Oharu Skill Hub

Documentation hub for the custom Claude Code skills and Gemini gems in [`oharu121/skills`](https://github.com/oharu121/skills).

Built with [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/). Bilingual (English + 日本語), deployed on Vercel.

- **Site:** https://oharu-skill-hub.vercel.app
- **Source skills:** https://github.com/oharu121/skills

## What's documented

7 Claude Code skills and 3 Gemini gems — original prose, copy-paste install commands, narrative walkthroughs.

- [Skills](https://oharu-skill-hub.vercel.app/skills/)
- [Gems](https://oharu-skill-hub.vercel.app/gems/)
- [Getting started](https://oharu-skill-hub.vercel.app/start/welcome/)

## Local development

```bash
pnpm install
pnpm dev          # dev server at http://localhost:4321
pnpm build        # production build to ./dist/
pnpm preview      # preview the production build
```

## Project structure

```
src/
  content/docs/       English pages (served at /)
    ja/               Japanese mirror (served at /ja/)
    start/            Getting started pages
    skills/           Per-skill guides + references
    gems/             Gemini gem guides
  components/         InstallCommand, SkillCard, SkillGrid
  data/skills.ts      Single source of truth for slugs, install commands, translations
  assets/             Screenshots and logo
astro.config.mjs      Site + sidebar + i18n config
```

## Adding a new skill page

1. Add the entry to [`src/data/skills.ts`](src/data/skills.ts) (slug, category, install commands, i18n title/tagline)
2. Write the English page at `src/content/docs/skills/<slug>.mdx` (or `<slug>/index.mdx` if a reference page is needed)
3. Write the Japanese mirror at `src/content/docs/ja/skills/<slug>.mdx`
4. Add the skill to the sidebar in [`astro.config.mjs`](astro.config.mjs)
5. `pnpm build` to verify — Starlight fails on broken internal links

## License

MIT
