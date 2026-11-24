# Plan: Run /simplify in the release flow and drop prompt upkeep

**Status:** Completed
**Date:** 2026-11-24

## Context

This repo's release skill was adapted from the one that ships oharu-tech-blog. Two
changes have since landed in that skill and not here.

First, oharu-tech-blog runs `/simplify`, Claude Code's bundled code-cleanup review, as a
step inside the release flow. Before that, the rule lived in that repo's project
instructions as a reminder to run it before invoking `/release`. That placement is
exactly why this skill never got it: the rule was not in the file that was copied.

Second, the owner now runs Claude Code in auto mode, where permission prompts barely
occur. The release skill's "Command Shape" section explained its command habits entirely
in terms of matching `allowed-tools` rules so that no prompt fires, and it told every
editor to keep that list in step with each new command. That upkeep now buys nothing.
The habits themselves still matter for a different reason: worktree isolation refuses any
command whose text it cannot prove stays inside the worktree. That includes `$( )`, shell
variables, `git -C`, and a heredoc or `node -e` string that mentions git.

## Approach

Add the simplify step at the point the blog's flow uses: after the staging list is
settled and before the plan file is written. That way the plan describes the code that
will merge, and validation covers whatever `/simplify` changed. Scope it to the staging
list, so another session's work in progress in the working tree is never reviewed or
edited. Skip it when every path is Markdown, since this site's guide pages are `.md`/`.mdx`
and `/simplify` reviews code.

Rewrite "Command Shape" around worktree isolation instead of allow-rule matching. Keep
the `allowed-tools` frontmatter, and call it best-effort and no longer maintained.

## Changes

- **Step 0c: Simplify the Code**
  - Skips when no staged path is code, meaning every path ends in `.md` or `.mdx`.
  - Otherwise invokes the `simplify` skill with the staged code paths as args, and carries
    on in the same turn.
  - Its edits are validated in Step 9 and staged in Step 12.
- **`allowed-tools`**: adds `Skill(simplify)` and `Skill(simplify *)`; the exact form alone
  does not match a call that passes arguments.
- **Error table**:
  - a row for `/simplify` editing a path off the staging list;
  - the "raises a permission prompt" row is replaced by a worktree-refusal row.
- **Opening note**: the `AskUserQuestion` rule now keeps the release inside one turn, with
  no mention of grants.
- **Command Shape**:
  - rewritten around worktree isolation: one plain command per call, no shell variables or
    substitutions, multi-line content via the Write tool;
  - `allowed-tools` is called best-effort, keeping the two glob cautions for anyone who
    edits it.

## Files Modified

| File | Change |
| ---- | ------ |
| [.claude/skills/release/SKILL.md](https://github.com/oharu121/oharu-skill-hub/blob/main/.claude/skills/release/SKILL.md) | Step 0c, `allowed-tools`, Command Shape, opening note, error table |

## Guard Rails

| Scenario | Behavior |
| --- | --- |
| A release changes only guide pages | Step 0c skips and says so |
| The working tree holds another session's page | It is off the staging list, so `/simplify` never sees it |
| `/simplify` edits a file off the list anyway | Reported; Step 12 does not stage it |
| A release runs in a worktree | Command Shape keeps every command plain, so isolation does not refuse it |

## Verification

1. `grep -n "### 0c: Simplify" .claude/skills/release/SKILL.md` shows the step.
2. `grep -n "permission prompt" .claude/skills/release/SKILL.md` prints nothing.
3. `node .claude/skills/release/scripts/release-guard.ts locale-parity` and `pnpm build` pass.

## Breaking Changes

None.
