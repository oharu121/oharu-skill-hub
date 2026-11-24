# Plan: Port the simplify step's scope and staging fixes

**Status:** Completed
**Date:** 2026-11-24

## Context

The `release` skill's Step 0c runs `/simplify` on the code a release ships. A review of
the same step in oharu-tech-blog's release skill found three gaps that this copy shares:

- **YAML is not code.** The source-file list leaves out `.yml` and `.yaml`, so a release
  that changes only a workflow or `pnpm-workspace.yaml` skips `/simplify`.
- **Created files cannot be told from someone else's.** Step 0c adds each "new untracked
  path" after `/simplify` returns, but a single `git status` cannot tell a file `/simplify`
  made from another session's untracked file. Step 12's "stage by name" rule never names the
  exception either.
- **An off-list edit that staged code depends on has no safe outcome.** Suppose
  `/simplify` moves a helper into a shared module that is not on the staging list. Leaving
  the edit out breaks `main` after the merge; staging it ships a file the owner did not name.

## Approach

Port the fixes oharu-tech-blog shipped, keeping each one in the step that owns it:
- add `.yml` and `.yaml` to the list;
- compare the post-`/simplify` status with Step 0b's status;
- stop and ask on the dependent-edit case instead of choosing either broken outcome.

## Changes

- **Step 0c**:
  - `.yml` and `.yaml` count as code;
  - created files are the untracked paths that are new since Step 0b;
  - an off-list edit that staged code depends on stops the flow and asks.
- **Step 12**: a file `/simplify` created counts as put there.
- **Error table**: the off-list-edit row branches on whether staged code depends on it.

## Files Modified

| File | Change |
| ---- | ------ |
| [.claude/skills/release/SKILL.md](https://github.com/oharu121/oharu-skill-hub/blob/main/.claude/skills/release/SKILL.md) | Step 0c, Step 12, error table |

## Guard Rails

| Scenario | Behavior |
| --- | --- |
| A release changes only a GitHub workflow | `/simplify` reviews it |
| Another session left an untracked file before the release | It was in Step 0b's output, so it is not staged |
| `/simplify` moves a helper into an off-list module | The flow stops and asks |

## Verification

1. `grep -n "\.yml\|Step 0b printed\|stop and ask" .claude/skills/release/SKILL.md` shows each change.
2. `node .claude/skills/release/scripts/release-guard.ts locale-parity` and `pnpm build` pass.

## Breaking Changes

None.
