# Validation Pattern: pnpm (Astro + Starlight)

**Summary for Phase 0 announcement:** locale parity check and production build.

`npm` and `npx` are blocked on this machine. Every command here uses `pnpm` / `pnpm dlx`.

## Validation Steps

This is the **full validation suite**. It runs once in Step 9, and again in Step 12.6 only
when code review produced edits. There is no CI in this repo, so this is the only gate
that runs before `main` deploys to production.

```bash
node .claude/skills/release/scripts/release-guard.ts locale-parity
pnpm build
```

`locale-parity` fails when a page under `src/content/docs/` has no mirror under
`src/content/docs/ja/`, or the reverse. Starlight renders a missing Japanese page as the
English one with a "not translated" notice, so the build passes on it.

`pnpm build` runs `astro build`, which also builds the Pagefind index. Starlight fails
the build on a sidebar `slug` with no page and on invalid page frontmatter. It does
**not** check links inside page prose: no links validator is installed, so a broken
`/skills/<slug>/` link builds green. The review checks those (Dimension 2).

There is no `check`, `lint` or `test` script, and none is invented here. `astro check` is
not installed (`@astrojs/check` is not a dependency), so type errors in `.astro` and `.ts`
files surface only where they break the build.

## On Failure

Show the failing output first, then use AskUserQuestion:

- "Validation failed. How do you want to proceed?"
- Options: "Fix first (cancel release)", "Skip validation and continue"

## On Pass

State: "Validation passed (`locale-parity`, `pnpm build`)." Quote any warning the build
printed, with file and meaning; a passing build with warnings is not a clean pass.

---

## Version Bump

Step 11 sets the version chosen in Step 4 explicitly, without the `v`:

```bash
pnpm version <x.y.z> --no-git-tag-version --no-git-checks
```

An explicit version, not `patch`/`minor`/`major`, because Step 4 computes the version from
the git tag and `package.json` may disagree with the tag. A relative bump would apply to
`package.json`'s number and land on a different version than the one the owner picked.

`--no-git-tag-version` updates `package.json` without committing or tagging, so the skill
controls both. The tag is created in Step 14, after the squash merge lands on `main`.

`--no-git-checks` is required. `pnpm version` aborts with `ERR_PNPM_UNCLEAN_WORKING_TREE`
when anything is uncommitted, and Step 11 runs before Step 12 commits the release changes.

### Drift Check

Before bumping, compare the latest git tag from Step 4 with `version` in `package.json`,
read with the **Read tool**. Do not shell out to `node -p`; you already hold both values.

If they differ, state both in the Step 4 version question so the owner picks with the
drift in view. The explicit bump above repairs `package.json` either way.

When `package.json` is *ahead* of the tag, check
`git merge-base --is-ancestor v<tag> origin/main` before assuming `package.json` is wrong:
a tag created on a feature branch that squash merge orphaned is invisible to
`git describe`.
