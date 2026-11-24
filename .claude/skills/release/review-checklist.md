# Code Review Checklist

Passed to the review subagent in Step 12.5, together with `git diff origin/main...HEAD` and the
issue body from Step 6b.

Two axes, and they fail differently. **Standards** (Dimensions 1–5, 7) asks whether the
diff is correct on its own terms; **Spec** (Dimension 6) asks whether it is the change
that was asked for. A clean Standards pass is not evidence for Spec.

## Scope

This is a **bilingual Astro + Starlight documentation site** for the Claude Code skills
and Gemini gems in `oharu121/skills`. English pages live under `src/content/docs/`, their
Japanese mirrors under `src/content/docs/ja/`. Skill metadata lives in
`src/data/skills.ts`; the sidebar lives in `astro.config.mjs`. Static output, Vercel
deploy, no backend.

Review the diff only. Do not report on unchanged code.

## What NOT to report

Validation already catches these:

- **A page missing its other-locale mirror** — `release-guard.ts locale-parity` fails on it.
- **A sidebar `slug` with no page, or invalid frontmatter** — `astro build` fails on both.

Also skip: style preferences, formatting, naming bikeshedding, and "consider extracting
this" suggestions. Report defects, not opinions.

## Dimensions

### 1. Locale consistency

- A Japanese page whose content diverged from its English page: a section, an option
  table row, an install command or an example present in one locale only.
- A new `skills.ts` entry missing `i18n.en` or `i18n.ja`, or with an untranslated
  English `tagline` under `ja`.
- A new sidebar group or item in `astro.config.mjs` with a `label` and no
  `translations: { ja: … }`, so the Japanese sidebar shows English.
- User-facing English text hardcoded in a component in `src/components/` instead of
  chosen by the current locale.

### 2. Links and registry integrity

- A link in page prose to a page that does not exist. **The build does not catch these.**
  Check each changed internal link against the files under `src/content/docs/`. A
  Japanese page linking to an English path (`/skills/…` instead of `/ja/skills/…`) counts.
- A `skills.ts` entry whose `slug` has no page, or a new skill page with no `skills.ts`
  entry, so it is missing from the skill grids.
- A `related` slug that names no entry in `skills.ts`.
- A new skill page that is missing from the sidebar in `astro.config.mjs`.
- An install command or `github` URL that does not match the skill's real name and path
  in `oharu121/skills`. These are copied by readers verbatim.
- An image import or `src/assets/skills/<slug>/` asset added without the other half.

### 3. Dead code

- A component in `src/components/` or an export in `src/data/` that nothing imports.
- An asset under `src/assets/` that no page references.
- The repo has no `knip` or ESLint, so this pass is the only dead-code signal.

### 4. Static-build safety and accessibility

- `document` / `window` / `localStorage` referenced in component frontmatter rather than
  a client `<script>`.
- A client script that assumes an element exists without a null check.
- Colours that resolve in only one of Starlight's light and dark themes — a hardcoded hex
  instead of a `--sl-color-*` custom property.
- An image without meaningful `alt` text, or headings skipped for visual reasons.

### 5. Secrets and leakage

- Tokens, API keys, or credentials in committed files, including in screenshots added
  under `src/assets/`.
- Absolute local paths (`/Users/...`) baked into pages, examples or config.

### 6. Spec conformance

The other dimensions read the diff alone. This one reads the diff **against the
Acceptance Criteria** in the issue body, the only place they exist.

Take each `AC-<n>` in turn and decide which of three it is:

- **Met** — name the file and line in the diff that satisfies it. A criterion you cannot
  point at is unverified, not met.
- **Unmet** — nothing in the diff implements it. 🔴, regardless of how small the gap
  looks: the PR body and the closing comment both claim it was delivered.
- **Unverifiable from the diff** — the criterion is about rendered output. Say so and
  name what would settle it: the Vercel preview deployment on the PR, or a local
  `pnpm build && pnpm preview`. Do not guess.

Then look the other way, at diff-not-in-AC: **changes no criterion asked for.** 🟡 — not
because it is wrong, but because it is unreviewed by the issue.

**If no Acceptance Criteria were passed, skip this dimension and say so.** Do not infer
criteria from the diff, the plan, or the issue title.

### 7. Code smells

Labelled heuristics ("possible Duplicated Code"), never hard violations. A documented
repo convention wins over the smell. Diff-scoped, real instances only:

- **Mysterious Name** — a name that does not reveal what it holds. → rename it.
- **Duplicated Code** — the same shape in more than one hunk or file. Install commands and
  skill metadata repeated in page prose instead of read from `skills.ts` count. → extract
  it, call it from both.
- **Primitive Obsession** — a string standing in for a domain concept, such as a
  category or locale outside the `Category` / `Locale` types. → use the type.
- **Shotgun Surgery** — one logical change forcing scattered edits. → gather what changes
  together.
- **Speculative Generality** — props, parameters or options no page uses. → delete it.
- **Middle Man** — a component that only passes its props through to another. → call the
  real one.

## Output Format

Report as `path/to/file.mdx:42 — description`, grouped by severity:

```markdown
## Code Review

### 🔴 High (must fix)

- `src/content/docs/ja/skills/logo/index.mdx:31` — <what is broken and what it causes>

### 🟡 Medium (recommended)

- `src/data/skills.ts:88` — <description>

### 🟢 Low (optional)

- `src/components/SkillCard.astro:12` — <description>
```

Dimension 6 findings anchor to the criterion instead: `AC-2 — <what is missing>`. Precede
the severity groups with the coverage table, reported **every run**, pass or fail:

```markdown
### Spec conformance

| AC   | Verdict      | Evidence                         |
| ---- | ------------ | -------------------------------- |
| AC-1 | Met          | `src/data/skills.ts:40`          |
| AC-2 | Unmet        | nothing in the diff addresses it |
| AC-3 | Unverifiable | needs the Vercel preview         |
```

If nothing is found:

```
✓ Code review passed. No significant issues found.
```

The spec table still prints above that line.

Severity means impact, not effort. A broken page or a wrong install command is 🔴 even
if the fix is one line. An unused export is 🟢 even if it is a whole file.
