---
name: release
description: Release a change to the Oharu Skill Hub. Creates a GitHub issue and plan file, validates locale parity and the build, reviews the diff, opens a PR, waits for the Vercel preview, squash merges, tags, and publishes a GitHub release.
user-invocable: true
allowed-tools: Bash(git describe *), Bash(git rev-parse --git-dir --git-common-dir), Bash(git branch -m *), Bash(git checkout --detach origin/main), Bash(git worktree remove .claude/worktrees/*), Bash(git worktree list --porcelain), Bash(git status --porcelain), Bash(git status --porcelain *), Bash(git status --short), Bash(git log *), Bash(git diff *), Bash(git rev-list *), Bash(git merge-base *), Bash(git branch --show-current), Bash(git fetch), Bash(git fetch *), Bash(git pull), Bash(git pull *), Bash(git checkout -b *), Bash(git checkout main), Bash(git add *), Bash(git commit -m *), Bash(git push -u origin *), Bash(git push origin v*), Bash(git tag v*), Bash(curl -sS -o /dev/null *), Bash(sleep *), Bash(gh issue *), Bash(gh pr *), Bash(gh release *), Bash(gh repo view *), Bash(gh api repos/*/milestones*), Bash(gh api repos/*/deployments*), Bash(gh api repos/*/commits/*), Bash(pnpm build), Bash(pnpm preview), Bash(pnpm version *), Bash(mktemp -d), Bash(node .claude/skills/release/scripts/release-guard.ts *), Skill(simplify), Skill(simplify *), Read, Write, Edit, Glob, Grep, AskUserQuestion, Task, TodoWrite
---

# Release Skill

Orchestrate a full release of this site: GitHub issue, validation, feature branch, code
review, PR, Vercel preview, squash merge, tag, GitHub release.

**Every interaction with the user goes through `AskUserQuestion`, never plain text.** That
keeps the whole release inside one turn: a plain-text question answered as a new user
message ends the turn, and the flow has to be picked up again from whatever the next
message says.

**`npm` and `npx` are blocked on this machine.** Use `pnpm` / `pnpm dlx`.

## Path Variables

Both are **placeholders you substitute**, not shell variables. Writing `$SCRATCH` in a
command leaves it unset, and `gh` is handed `/issue-body.md`.

- `SKILLS_DIR` = `.claude/skills/release`
- `<SCRATCH>` = the session scratchpad directory from your environment, spelled out as an
  absolute path in every command. If none is given, use `mktemp -d` and keep the path it
  prints. **Never write scratch files inside the repo**: they get swept into `git add`.

Run every command from the repo root. The guard script is called by its repo-relative
path.

## Command Shape

A release may run from a worktree, and worktree isolation refuses any command it cannot
prove is not git escaping the worktree. It judges the command text, so a value computed
at runtime is refused in any command, git or not:

- **One plain command per Bash call.** No `$( )`, no `if`, no git inside a pipe chain or an
  inline script, and never `git -C <path>`. Guards that need a real non-zero exit live in
  `SKILLS_DIR/scripts/release-guard.ts`.
- **Never use a shell variable or substitution.** Inline the literal value you already
  hold: the branch name, the tag, the issue number.
- **Write multi-line content with the Write tool**, then `cat` the pieces together. A
  heredoc or a `node -e` string that mentions git is refused even when it runs no git.

The `allowed-tools` frontmatter is best-effort and not kept in step with every command: in
auto mode it does nothing. When you do edit it, write one `Bash(...)` per rule
(`Bash(a *, b *)` is a single rule that matches nothing), and remember that a trailing `*`
also matches flags appended after it.

## Fixed Settings

Constants for this repo. **Every row is read by the step named beside it.** Never add a
row no step reads.

| Setting        | Value                                                                  | Read by        |
| -------------- | ---------------------------------------------------------------------- | -------------- |
| Repo           | **`oharu121/oharu-skill-hub`**                                         | Steps 6a, 13.5, 14, 15 |
| Site           | **`https://oharu-skill-hub.vercel.app`**                               | Step 14.5      |
| Language       | **English**                                                            | Steps 5, 14    |
| Validation     | **`SKILLS_DIR/patterns/pnpm.md`**                                      | Steps 0b, 4, 9, 11, 12.6 |
| Labels         | **`enhancement`, `bug`, `documentation`** — the repo's own labels      | Step 3         |
| Commit message | **`auto`** — set to `ask` to approve the message before committing     | Step 12        |
| Push + PR      | **`auto`** — set to `ask` to approve before pushing                    | Step 13        |
| Merge          | **`auto`** — set to `ask` to always confirm the merge                  | Step 13.5      |
| Release title  | **`v<version> — <title>`** (em dash) — a template, not a switch        | Step 14        |

`Merge` is `auto` only conditionally, because `main` deploys to production and this repo
has no CI. Step 13.5 merges without asking only when validation passed, the Vercel
preview built, and the review came back clean. It asks whenever the review left something
a human has to settle.

Do not add a confirmation gate to a step that has no row.

**Language** applies to the issue body, plan file, PR body, and release notes. Commit
messages stay English. A direct instruction when invoking `/release` outranks the row.

### What is still asked

| Step | Question                     | Why                                                   |
| ---- | ---------------------------- | ----------------------------------------------------- |
| 2–4  | Title, labels, version       | Editorial and semantic. Ask all three in **one** `AskUserQuestion` call |
| 12.5 | Code review found something  | The step that catches defects                         |
| 13.5 | Merge, when a fallback fires | A 🔴 continued past, or an `Unverifiable` criterion   |
| 17.5 | Update the main checkout     | Another session may have work there                   |

---

## Tag Ordering — read before touching Step 11 or 14

**Never create the tag on the feature branch.** Squash merge replays the diff as a new
commit on `main` with a new SHA and discards the branch. A tag made on the branch points
at a commit that is not an ancestor of `main`, so `git describe --tags --abbrev=0` (which
Step 4 of the next release reads) cannot see it.

The tag is created in **Step 14**, on the merge commit, after the merge has landed. Step
11 bumps the version but does not tag. Step 13 pushes the branch but does not push tags.

---

## Reusable Patterns

### Pattern: Safe GitHub Body Write

Issue, PR and release creation all use this. **Never use `--body` or bash heredocs** for
markdown: backticks, tables and special characters break quoting.

1. Write the content to `<SCRATCH>/<filename>.md` with the **Write tool**.
2. Pass `--body-file "<SCRATCH>/<filename>.md"` (or `--notes-file` for a release).
3. Verify the body landed:
   ```bash
   node .claude/skills/release/scripts/release-guard.ts body-check <issue|pr|release> <id>
   ```
4. **Non-zero exit means stop.** Do not continue the release.

### Pattern: Detect an In-Progress Release

An aborted release leaves its state in git and GitHub. Read it back from there; keep no
state file.

```bash
git branch --show-current
git status --porcelain .plans/
```

- **Branch is not `main`, and an open PR or issue exists for it** → a release reached
  Step 10.6. Take `<slug>` from the branch name after its prefix. A branch with neither is
  not a release; say so and start fresh. A detached HEAD prints nothing; skip the queries.
- **An untracked file under `.plans/`** → a release reached Step 5 but aborted before the
  branch existed. Restarting blind here creates a **duplicate issue**. Confirm with:

  ```bash
  gh issue list --state open --assignee @me --search "<slug>"
  ```

  No matching issue means the file is a working document, not a release. Say so and carry
  on.

Recover the rest:

| Value          | Where to read it back from                                     |
| -------------- | -------------------------------------------------------------- |
| Slug           | The branch name after its prefix, or the `.plans/` filename    |
| Title, context | The plan file                                                  |
| Issue          | `gh issue list --state open --assignee @me --search "<slug>"`  |
| Version base   | `git describe --tags --abbrev=0`                               |
| Bump done?     | `git log origin/main..HEAD --oneline --grep '^Bump version'`   |
| PR             | `gh pr list --head <branch> --json number,url,state`           |

Then AskUserQuestion: "Found an in-progress release for `<slug>` (issue #N, PR #M).
Resume?" — "Yes, resume" (Recommended) / "No, start fresh". On "start fresh", ask whether
to close the orphaned issue and delete the branch. Do neither silently.

---

## Phase 0: Startup

### 0a: Check for an In-Progress Release

Follow **Detect an In-Progress Release**. If resuming, skip to the phase that matches
what already exists.

### 0b: Load the Validation Pattern

Read the file named by the **Validation** row. State what will run (`locale-parity`,
`pnpm build`) and continue without asking.

Then look at what is pending:

```bash
git status --porcelain -uall
```

`-uall` lists every untracked file rather than collapsing a new directory to one line,
which Step 0c needs to tell its own new files apart.

**Name every path it prints.** The main checkout often holds another session's work in
progress, such as a half-written skill page. Ask with AskUserQuestion which paths belong to
this release before Step 1; the answer is the staging list for Step 12. Never stage a path
the owner did not name.

### 0c: Simplify the Code

**When no path on the staging list is code, skip this step and say so.** Code means a
source file: `.ts`, `.js`, `.mjs`, `.astro`, `.css`, `.json`, `.yml` or `.yaml`. Guide pages (`.md`,
`.mdx`) and images under `src/assets/` are not code, so a release of those alone has
nothing for `/simplify`.

**Otherwise**, invoke the `simplify` skill with the Skill tool. Pass as its args the code
paths on the staging list, space-separated, so it reviews and edits those and nothing
else. Never pass a path the owner left off the list.

Apply what it finds, then **carry on with Phase 1 in the same turn**. Do not stop to
report: ending the turn ends the release flow. Its edits stay uncommitted. Step 9
validates them and Step 12 stages them with the rest of the staging list.

**A file `/simplify` creates joins the staging list**, such as a helper it extracted,
because a staged file now imports it. Run `git status --porcelain -uall` after it returns and
compare it with the output Step 0b printed: each untracked path that is new since then is
one it made. An untracked path already in Step 0b's output belongs to someone else. Step 9
would not catch the omission: it builds the working tree, where the file exists.

**When it edits an existing file off the list, stop and ask with AskUserQuestion** if staged code now depends
on that edit, such as a helper moved into a shared module. Leaving the edit out breaks
`main` after the merge, and staging it ships a file the owner did not name. An edit
nothing staged depends on is reported and left out; see the error table.

This runs before the plan file exists so that Step 5 describes the code that will merge.

---

## Phase 1: Context + Planning

### Step 1: Gather Context

Read back through the session and the pending diff for what goes in the plan file (Step 5)
and the issue (Step 6b). `templates/plan.md` is the structure.

### Step 2–4: Title, Labels, Version

Read the current version first:

```bash
git describe --tags --abbrev=0
```

Then read `version` in `package.json` with the Read tool and run the Drift Check in the
**Validation** pattern.

Ask all three in **one** AskUserQuestion call:

- **Title**: three concise, action-oriented suggestions. "Other" is automatic.
- **Labels** (multiSelect): the values in the **Labels** row. `gh issue create` fails on
  a label the repo does not have, so offer no others.
- **Version**: patch `v{x}.{y}.{z+1}`, minor `v{x}.{y+1}.0`, major `v{x+1}.0.0`, or Skip
  (no tag or release). Name any drift from the Drift Check in the question. A new skill or
  gem guide is a minor; a correction to existing pages is a patch.

Always prefix the version with `v`. **Store the title, labels and version.**

### Step 5: Create Plan File

Read `SKILLS_DIR/templates/plan.md` for the template and rules. Create
`.plans/<slugified-title>.md` with real content, written in the **Language** row.

**All file links are absolute** `https://github.com/oharu121/oharu-skill-hub/blob/main/...`
URLs. The plan is copied verbatim into the issue and the PR body, where a repo-relative
link 404s.

**Store the slug.** Step 10.6 reuses it as the branch name.

### Step 6: Create GitHub Issue

#### 6a: Milestone (version selected only)

```bash
gh api repos/oharu121/oharu-skill-hub/milestones -X GET -f state=all -f per_page=100 --paginate --jq '.[] | select(.title == "<version>") | "\(.number)\t\(.state)"'
```

`--paginate` and `state=all` are both required, or a milestone past the first page or a
closed one reads as missing.

If it exists but is closed, reopen it:

```bash
gh api repos/oharu121/oharu-skill-hub/milestones/<number> -X PATCH -f state=open
```

If missing, create it:

```bash
gh api repos/oharu121/oharu-skill-hub/milestones -f title="<version>" -f state="open"
```

#### 6b: Create the Issue

Read `SKILLS_DIR/templates/issue-body.md` for the format. Follow **Safe GitHub Body
Write**:

```bash
gh issue create --title "<title>" --label "<labels>" --assignee "@me" --milestone "<version>" --body-file "<SCRATCH>/issue-body.md"
```

Omit `--milestone` if the version was skipped. Then `body-check issue <issue-number>`.

### Step 7: Commit Message

```
<type>(<scope>): <description> (#<issue-number>)
```

`<type>` is `feat` for a new guide or feature, `fix` for a correction, `docs` for README
or repo docs, `chore` for tooling such as this skill. `<scope>` is the area: `skills`,
`gems`, `start`, `components`, `release`.

Output: `Issue created: <url> — proceeding with validation...`

---

## Phase 2: Validation

### Step 8: Check Remote Status

```bash
git fetch
git rev-list --count HEAD..origin/main
```

Compare against `origin/main`, never `@{u}`: a worktree branch tracks `origin/main` until
its first push.

If the remote has new commits, AskUserQuestion: "Remote has new commits. Pull with rebase
before continuing?" — "Yes, pull --rebase" / "No, continue anyway" / "Cancel". Pull with
`git pull --rebase origin main`; stop on conflicts.

### Step 9: Run Validation

Follow the pattern named by the **Validation** row. If it fails, stop until resolved.

### Step 10: Update README and CHANGELOG

#### 10a: README.md

Check [README.md](../../../README.md) against the change:

- The skill and gem counts under "What's documented" ("7 Claude Code skills and 3 Gemini
  gems") and the links beside them
- "Project structure" and "Adding a new skill page", if the change moved a path or added a
  step

#### 10b: CHANGELOG.md

`CHANGELOG.md` follows Keep a Changelog 1.1.0. Match its existing style exactly:
version headings are `## [v<x.y.z>] — <YYYY-MM-DD>` (bracketed `v` version, em dash), and
link refs at the bottom point at `releases/tag/v<x.y.z>`.

First, **sweep for what landed since the last tag**, using the tag from Step 4 spelled out:

```bash
git log v<last-tag>..HEAD --format='%h %s'
```

Anything found that is not recorded belongs in this release's entry.

- **Version selected** → add `## [<version>] — <YYYY-MM-DD>` above the previous release,
  folding in any `## [Unreleased]` entries and removing that section, and add the link ref
  `[<version>]: https://github.com/oharu121/oharu-skill-hub/releases/tag/<version>`.
- **Version skipped** → add the entries under `## [Unreleased]`, creating that section
  above the newest release if it is missing.

Use the **Edit tool**. Entries describe what a reader of the site gets — "Added a guide for
the `logo` skill, in English and Japanese" — not files changed.

Both files land in the same commit as the change.

### Step 10.6: Create Feature Branch

```bash
git branch --show-current
```

| Prints            | Action                                                       |
| ----------------- | ------------------------------------------------------------ |
| `main`            | `git checkout -b <type>/<slug>`                              |
| `worktree-<name>` | `git branch -m <type>/<slug>` — rename the fresh worktree branch in place |
| nothing (detached) | `git checkout -b <type>/<slug>`                             |
| anything else     | keep it — the owner started that branch deliberately         |

`<type>` is the commit type from Step 7; `<slug>` is the plan slug from Step 5. **Keep the
branch name literally** for Steps 13–13.6.

Uncommitted changes carry over to the new branch, including the paths Step 0b excluded.
That is expected; Step 12 stages by name.

---

## Phase 3: Release

### Step 11: Bump Version

**"Skip" in Step 4:** skip this step.

Follow "Version Bump" in the **Validation** pattern, then commit the bump alone:

```bash
pnpm version <x.y.z> --no-git-tag-version --no-git-checks
git add package.json
git commit -m "Bump version to <x.y.z>"
```

**Do not tag here.**

### Step 12: Commit Release Changes

```bash
git status --short
```

Read the **Commit message** row. On `auto`, state the message and the paths, then commit;
on `ask`, confirm first.

```bash
git add <the paths named in Step 0b, the files Step 0c added, CHANGELOG.md, README.md and the plan file>
git commit -m "<commit message from Step 7>"
```

**Stage by name, never `git add -A` or `git add .`.** Anything in `git status` you did not
put there and the owner did not name is reported, not committed. A file `/simplify`
created in Step 0c counts as put there.

### Step 12.5: Code Review

```bash
git diff origin/main...HEAD
```

`origin/main`, not `main`: in a worktree the local `main` may be behind.

Fetch the Acceptance Criteria with the issue number as a literal:

```bash
gh issue view <issue-number> --json body --jq .body
```

The AC exist **only** in the issue body. Without them Dimension 6 skips, and a forgotten
fetch reads as a clean review.

Spawn a subagent with the Task tool. Pass it the full diff, the issue body, and the
contents of `SKILLS_DIR/review-checklist.md` as its instructions. Display the result,
then:

- **🔴 findings, including any unmet AC** → AskUserQuestion: "High-severity issues found.
  Fix before releasing?" — "Yes, fix first" / "No, continue anyway".
- **🟡/🟢 only** → AskUserQuestion: "Medium/low findings. Fix now?" — "Yes, fix" / "No,
  continue".
- **Nothing found** → state "✓ Code review passed." and continue.

**An `Unverifiable` verdict is not a pass.** Carry it to Step 13.5, where the Vercel
preview settles it.

If the user aborts, leave the branch in place. Phase 0 offers to resume.

### Step 12.6: Re-validate and Re-document After Review Edits

**Only if Step 12.5 produced edits.** Re-run the **Validation** pattern, then commit the
fixes.

Then update the two documents written before the review existed:

- **CHANGELOG** — if a reader of the site would notice the fix, add it to the section 10b
  wrote. Edit that section in place; do not re-run Step 10b, which would duplicate it.
  Step 14 copies this section into the release notes verbatim.
- **Plan file** — if the fix changed the mechanism the plan describes, update Approach,
  Changes, Guard Rails and Verification. Keep Context; record what the review caught.

```bash
git add CHANGELOG.md .plans/<slug>.md
git commit -m "docs: <what the review fix changed> (#<issue-number>)"
```

The PR body is rebuilt from the plan in Step 13, but the issue body is not. Rebuild
`<SCRATCH>/issue-body.md` from the corrected plan plus the unchanged AC, and push it:

```bash
gh issue edit <issue-number> --body-file "<SCRATCH>/issue-body.md"
```

### Step 13: Push Branch and Open PR

Read the **Push + PR** row. On `ask`, confirm first.

```bash
git push -u origin <branch>
```

Write the PR body to `<SCRATCH>/pr-body.md`, embedding the plan file's **full content**:

```markdown
Closes #<issue-number>

<full content of .plans/<slug>.md>

## Checklist

- [x] `locale-parity` passed
- [x] `pnpm build` passed
- [x] Code review completed
```

**Immediately before creating the PR**, prove GitHub's copy of the branch is the one you
are describing. Building the body is when a stale plan gets noticed and edited, after the
push:

```bash
node .claude/skills/release/scripts/release-guard.ts push-guard <branch>
```

Non-zero exit names one of three states: local ahead (push again), origin ahead
(`git pull --ff-only`), or diverged (reconcile by hand). Do not create the PR until it
passes. Then:

```bash
gh pr create --base main --head <branch> --title "<commit message from Step 7>" --body-file "<SCRATCH>/pr-body.md"
```

Then `body-check pr <pr-number>`, and report the PR URL.

### Step 13.5: Wait for the Vercel Preview, Then Merge

There is no CI. The Vercel Git integration builds a preview deployment for every pushed
branch and reports it as a commit status named `Vercel`. That build is the remote gate.

Read its state on the branch head:

```bash
gh api repos/oharu121/oharu-skill-hub/commits/<branch>/status --jq '.statuses[] | select(.context == "Vercel") | .state'
```

- `pending`, or nothing printed yet → `sleep 30`, then read it again. After 10 minutes
  with nothing printed, stop and AskUserQuestion; the integration may be disconnected.
- `failure` or `error` → stop. Do not merge. The build that will deploy production failed.
- `success` → read the preview URL. `<head-sha>` is the full SHA `push-guard` printed;
  Vercel records the commit SHA as the deployment's ref, so `-f ref=<branch>` finds
  nothing:

```bash
gh api repos/oharu121/oharu-skill-hub/deployments -X GET -f sha=<head-sha> --jq '.[0].id'
gh api repos/oharu121/oharu-skill-hub/deployments/<deployment-id>/statuses --jq '.[0].environment_url'
```

Report the preview URL. Vercel may protect previews with Vercel Authentication, so it can
answer `401` to `curl` and still open in the owner's browser; do not treat that as broken.

Then read the **Merge** row. **Ask first if the row is `ask`, or if either is true:**

- Step 12.5 reported a 🔴 and the answer was "continue anyway".
- Any acceptance criterion came back `Unverifiable`. Name it and the preview URL in the
  question, so the owner can look before answering.

AskUserQuestion: "Preview is built. Merge the PR?" — "Yes, squash merge now" / "No, I'll
merge on GitHub" / "Cancel". On "No", confirm completion with AskUserQuestion before
continuing. On "Cancel", stop with the branch and PR in place.

**Otherwise merge without asking:**

```bash
gh pr merge <pr-number> --squash --delete-branch
```

The strategy is always `--squash --delete-branch`; Step 13.6 assumes it.

**On a non-zero exit, check whether it merged:**

```bash
gh pr view <pr-number> --json state --jq .state
```

`MERGED` means continue: gh merges through the API first and does local cleanup after, and
in a worktree the local checkout of `main` always fails with
`fatal: 'main' is already used by worktree at '…'`. Anything else means the merge failed —
tell the owner to merge on GitHub, and resume at Step 13.6 once they confirm.

### Step 13.6: Sync main and Clean Up the Branch

```bash
git rev-parse --git-dir --git-common-dir
```

**The two lines match (main checkout):**

```bash
git checkout main
git pull
git fetch --prune
node .claude/skills/release/scripts/release-guard.ts branch-cleanup <branch>
```

`git checkout main` carries the uncommitted paths Step 0b excluded along with it. If git
refuses because one of them would be overwritten, stop and report it; never stash or
discard them.

**The two lines differ (worktree):** `main` cannot be checked out here, so stand on the
merge commit detached:

```bash
git fetch --prune
git checkout --detach origin/main
node .claude/skills/release/scripts/release-guard.ts branch-cleanup <branch>
```

`branch-cleanup` usually reports `already gone` twice in the main checkout, and local
`deleted` plus remote `already gone` in a worktree. Both are normal. **Do not call
`git branch -D` directly**; it exits 1 on the expected case.

### Step 14: Tag and Create the GitHub Release

**"Skip" in Step 4:** skip to Step 14.5.

Verify HEAD is the merge commit:

```bash
node .claude/skills/release/scripts/release-guard.ts tag-guard <pr-number>
```

Non-zero exit means **do not tag**. Re-run Step 13.6's sync for your checkout, then this
check. Then tag and push that one tag:

```bash
git tag v<x.y.z>
git push origin v<x.y.z>
```

Never `git push --tags`. Confirm the tag is on `main`:

```bash
git merge-base --is-ancestor v<x.y.z> origin/main
```

It prints nothing either way; read its exit code. `0` means the tag is on `main`. Any
other exit means the tag is isolated: stop, and do not create the release.

Read `SKILLS_DIR/templates/release-notes.md`. The `## Changes` list is the CHANGELOG
section from Step 10b, verbatim. Build `--title` from the **Release title** row and follow
**Safe GitHub Body Write**:

```bash
gh release create v<x.y.z> --title "<Release title row, filled in>" --notes-file "<SCRATCH>/release-notes.md"
```

Then `body-check release v<x.y.z>`.

### Step 14.5: Confirm the Production Deploy

The merge to `main` triggers the production deployment. Read its state for the merge
commit:

```bash
gh api repos/oharu121/oharu-skill-hub/deployments -X GET -f sha=<merge-sha> -f environment=Production --jq '.[0].id'
gh api repos/oharu121/oharu-skill-hub/deployments/<deployment-id>/statuses --jq '.[0].state'
```

`<merge-sha>` is the commit `tag-guard` confirmed (or `gh pr view <pr-number> --json
mergeCommit --jq .mergeCommit.oid` on a skipped version). On `pending` or `in_progress`,
`sleep 30` and read again. On `success`, check the site:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://oharu-skill-hub.vercel.app/
```

Anything but `success` and `200` is reported in Step 17 as a failed deploy, with the
deployment state. The release is already merged and tagged, so do not undo either; the
owner decides whether to roll back in Vercel.

### Step 15: Close the Issue and Milestone

**Comment first, close second. Never `gh issue close --comment`.** The PR's `Closes` line
already closed the issue on merge, and `gh issue close --comment` on a closed issue exits
0 and drops the comment silently.

```bash
gh issue comment <issue-number> --body "Released in v<x.y.z>"
gh issue close <issue-number>
```

On a skipped version, the comment is `Shipped in <merge-sha>`. These one-line strings are
the only `--body` exception to Safe GitHub Body Write.

Then close the milestone (version selected only). If the first command prints `null`,
there is none:

```bash
gh issue view <issue-number> --json milestone --jq .milestone.number
gh api repos/oharu121/oharu-skill-hub/milestones/<number> -X PATCH -f state=closed
```

### Step 16: Clean Up

```bash
git status --porcelain
```

Report what remains: the paths Step 0b excluded, and anything else. Delete nothing.

**A release made from a worktree removes the worktree, without asking.** First both of
these must print nothing:

```bash
git status --porcelain
git log --oneline origin/main..HEAD
```

If either prints anything, keep the worktree and report what is in it. Otherwise:

- **Created by this session** → `ExitWorktree` with `remove`. It refuses with
  `Worktree has N commits … Removing will discard this work`, because it compares against
  the main checkout's local `main`. The checks above proved those commits are on
  `origin/main`, so re-invoke with `discard_changes: true`.
- **Entered by path** → `ExitWorktree` with `keep`, then
  `git worktree remove .claude/worktrees/<name>` from the main checkout.

If `git worktree remove` answers `cannot remove a locked working tree`, another session
holds it. Keep it and report the pid from `git worktree list --porcelain`. **Never pass
`-f`.**

### Step 17: Output Success

Plain markdown, with clickable links:

> Release complete!
>
> - **Issue:** [#N](issue-url)
> - **PR:** [#N](pr-url)
> - **Version:** old → new
> - **Tag:** `vX.Y.Z` (on `main`)
> - **Release:** [vX.Y.Z](release-url)
> - **Production:** deployment state, site status code

On a skipped version, replace the Version, Tag and Release lines with the commit message
and "No version tag or GitHub release (skipped)."

### Step 17.5: Ask Whether to Update the Main Checkout

**The last step.** This skill loads from the main checkout's `.claude/skills/`, so a
release made from a worktree changes nothing for later sessions until the main checkout's
`main` is pulled.

```bash
git rev-parse --git-dir --git-common-dir
```

**The two lines differ** → the session is still in a kept worktree. Ask whether to update
the main checkout once that worktree is dealt with, and name why Step 16 kept it.

**The two lines match** → read the main checkout's state:

```bash
git branch --show-current
git status --porcelain
git rev-list --count main..origin/main
```

AskUserQuestion, naming the branch, how many commits `main` is behind, and every path
`git status` printed:

- **Behind, `main` checked out, clean tree** → "Yes, pull now" (Recommended) / "No, leave
  it". On yes: `git pull --ff-only origin main`.
- **Behind, another branch checked out** → on yes: `git fetch origin main:main`, which
  fast-forwards `main` without touching the checked-out branch.
- **Behind, files listed** → offer "Leave it" (Recommended). Never stash, discard or
  overwrite them unless the answer says so.
- **Not behind** → say so, with "Nothing to do" recommended.

---

## Error Handling

| Scenario | Action |
| --- | --- |
| Remote fetch fails | Warn and continue |
| Pull conflicts | Stop, instruct to resolve manually |
| Validation fails | Stop, AskUserQuestion: fix or skip |
| `locale-parity` names a missing page | Write the mirror page, or confirm the page was meant to be removed in both locales |
| `gh issue create` fails on a label | The label does not exist in the repo. Use a value from the **Labels** row |
| Commit fails | Stop (likely a hook) |
| Branch already exists | AskUserQuestion: reuse it, or pick a new name |
| Code review finds 🔴 | AskUserQuestion: abort and fix, or continue at own risk |
| `push-guard` exits non-zero | Follow the direction it names, re-run it, then create the PR |
| `push-guard` cannot reach origin | Not a pass. Fix the network or credentials and re-run |
| PR create fails | Warn, provide the `gh pr create` command to run by hand |
| Vercel status is `failure` or `error` | Stop, do not merge. Open the status's `target_url` for the build log |
| No Vercel status after 10 minutes | Stop and ask. The Git integration may be disconnected |
| Preview URL answers `401` | Vercel Authentication on previews. Open it in the owner's browser |
| `gh pr merge` exits non-zero | `gh pr view <n> --json state --jq .state`. `MERGED` → continue; otherwise merge on GitHub, then resume at Step 13.6 |
| `git checkout main` refuses at Step 13.6 | An excluded uncommitted path conflicts. Stop and report it; never stash |
| HEAD ≠ merge commit at Step 14 | `tag-guard` failed. Do not tag. Re-run Step 13.6's sync, then the check |
| `TAG ISOLATED` after tagging | Do not create the release. Delete the tag, re-sync, re-tag on the confirmed merge commit |
| Tag already exists | Stop, AskUserQuestion with the next version |
| Production deploy not `success` | Report it in Step 17. Do not revert; the owner decides on a Vercel rollback |
| `branch-cleanup` reports DELETE FAILED | It printed the command to run by hand. A remote failure is tolerated |
| `git worktree remove` says `cannot remove a locked working tree` | Another session holds it. Keep it, report the pid. Never pass `-f` |
| Issue, PR or release body empty | `body-check` exited non-zero. Stop |
| `/simplify` created a new file | It joins the staging list (Step 0c), because staged code imports it |
| `/simplify` edited an existing file off the staging list | If staged code depends on the edit, stop and ask with AskUserQuestion (Step 0c). Otherwise report the path and the edit; Step 12 does not stage it, and never revert a file that held someone else's work |
| `git merge-base --is-ancestor` exits non-zero at Step 14 | The tag is isolated. Delete it, re-run Step 13.6's sync, and re-tag on the commit `tag-guard` confirms |
| Worktree isolation refuses a command as "too complex to verify" | Split it into plain standalone commands, per Command Shape. Never route around it with `git -C` or a script |
