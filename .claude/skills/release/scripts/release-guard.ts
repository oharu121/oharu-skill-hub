#!/usr/bin/env node
/**
 * The release steps whose exit code has to mean something.
 *
 * Each subcommand replaces an inline `VAR=$(...)` + `if [ ... ]; then exit 1;
 * fi` snippet. No Claude Code permission rule can match a variable assignment,
 * so those snippets prompt on every release; printing a value and letting the
 * model compare it turns a hard stop into a suggestion. These are the checks
 * that must not be skippable.
 *
 * Node builtins only, run with Node's native type stripping. Nothing here may
 * depend on `pnpm install` having happened.
 *
 * Run: node .claude/skills/release/scripts/release-guard.ts tag-guard      <pr-number>
 *      node .claude/skills/release/scripts/release-guard.ts push-guard     <branch>
 *      node .claude/skills/release/scripts/release-guard.ts body-check     <issue|pr|release> <id>
 *      node .claude/skills/release/scripts/release-guard.ts branch-cleanup <branch>
 *      node .claude/skills/release/scripts/release-guard.ts locale-parity
 */

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

/** stderr is inherited so gh's own error text reaches the user unedited. */
function run(file: string, args: string[]): string {
  return execFileSync(file, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

/**
 * Run a command whose failure is an answer rather than a problem, and swallow
 * its stderr. Returns null on any non-zero exit.
 */
function probe(file: string, args: string[]): string | null {
  try {
    return execFileSync(file, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

/**
 * Refuse to tag unless HEAD is the squash-merge commit GitHub actually wrote.
 *
 * A tag made one commit off is not an ancestor of `main`, so `git describe`
 * never finds it again and every later release computes its version from a
 * stale base.
 */
function tagGuard(pr: string): boolean {
  const merge = run("gh", ["pr", "view", pr, "--json", "mergeCommit", "-q", ".mergeCommit.oid"]);

  if (merge === "") {
    console.log(`tag guard FAILED: PR #${pr} has no merge commit — it is not merged yet.`);
    return false;
  }

  const head = run("git", ["rev-parse", "HEAD"]);

  if (merge !== head) {
    console.log(`tag guard FAILED: PR #${pr} merged as ${merge}, HEAD is ${head}.`);
    console.log("Do not tag. Re-run /release Step 13.6's sync for this checkout, then this check.");
    return false;
  }

  console.log(`tag guard ok: HEAD is PR #${pr}'s merge commit (${head}).`);
  return true;
}

/**
 * Refuse to open a PR when GitHub's copy of the branch is not the local one.
 *
 * Assembling the PR body is when a stale plan file gets noticed and fixed,
 * which is after the push. `gh pr create` opens the PR against whatever the
 * remote branch points at, and the squash merge lands that.
 *
 * Compares `refs/heads/<branch>`, not HEAD, because `gh pr create --head`
 * ships the named branch. Asks the remote with `ls-remote`, not the
 * `origin/<branch>` tracking ref, which only this clone's own fetches refresh.
 */
function pushGuard(branch: string): boolean {
  const local = probe("git", ["rev-parse", "--verify", `refs/heads/${branch}`]);

  if (local === null) {
    console.log(`push guard FAILED: no local branch ${branch}.`);
    return false;
  }

  // Non-zero exit: the question could not be asked. Empty output: no such branch.
  const listing = probe("git", ["ls-remote", "--heads", "origin", `refs/heads/${branch}`]);

  if (listing === null) {
    console.log("push guard FAILED: could not reach origin to check the branch.");
    console.log("Fix the connection or credentials and re-run — do not open the PR unverified.");
    return false;
  }

  if (listing === "") {
    console.log(`push guard FAILED: origin has no branch ${branch} — push it before opening a PR.`);
    console.log(`Run: git push -u origin ${branch}`);
    return false;
  }

  const remote = listing.split("\t")[0];

  if (local !== remote) {
    console.log(`push guard FAILED: local ${branch} is ${local}, origin/${branch} is ${remote}.`);

    // Three states, three remedies — name the one that applies.
    const remoteIsBehind = probe("git", ["merge-base", "--is-ancestor", remote, local]) !== null;
    const remoteIsAhead = probe("git", ["merge-base", "--is-ancestor", local, remote]) !== null;

    if (remoteIsBehind)
      console.log(
        `Commits exist locally that the PR would not contain. Run: git push origin ${branch}`,
      );
    else if (remoteIsAhead)
      console.log(`origin is ahead. Run: git pull --ff-only origin ${branch}`);
    else console.log(`The two have diverged. Reconcile them by hand before opening the PR.`);

    return false;
  }

  console.log(`push guard ok: origin/${branch} matches local ${branch} (${local}).`);
  return true;
}

const RESOURCES = ["issue", "pr", "release"] as const;

type Resource = (typeof RESOURCES)[number];

function isResource(value: string): value is Resource {
  return (RESOURCES as readonly string[]).includes(value);
}

/**
 * A `gh ... create --body-file` that silently wrote nothing still creates the
 * issue or release, so nothing downstream errors and the empty page is only
 * noticed by a human much later.
 */
function bodyCheck(resource: string, id: string): boolean {
  if (!isResource(resource)) {
    console.log(`unknown resource "${resource}" — expected ${RESOURCES.join(", ")}.`);
    return false;
  }

  const body = run("gh", [resource, "view", id, "--json", "body", "-q", ".body"]);

  if (body.length === 0) {
    console.log(`${resource} ${id} body is EMPTY. Stop the release flow — do not continue.`);
    return false;
  }

  console.log(`${resource} ${id} body verified (${body.length} chars).`);
  return true;
}

/** Branches this must never delete, whatever it is handed. */
const PROTECTED_BRANCHES = ["main", "master", "HEAD"];

/**
 * Remove both copies of a merged feature branch, treating "already gone" as
 * success. `gh pr merge --delete-branch` usually did this already; deleting
 * nothing must exit 0, or the expected case looks like a failure.
 */
function branchCleanup(branch: string): boolean {
  if (PROTECTED_BRANCHES.includes(branch)) {
    console.log(`refusing to delete "${branch}" — that is a protected branch name.`);
    return false;
  }

  const current = run("git", ["branch", "--show-current"]);

  if (current === branch) {
    console.log(
      `still on "${branch}" — move off it first (\`git checkout main\`, or in a worktree \`git checkout --detach origin/main\`).`,
    );
    return false;
  }

  if (probe("git", ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]) === null) {
    console.log(`local  ${branch}: already gone`);
  } else if (probe("git", ["branch", "-D", branch]) === null) {
    console.log(
      `local  ${branch}: DELETE FAILED — remove it by hand with: git branch -D ${branch}`,
    );
    return false;
  } else {
    // -D, not -d: squash merge rewrites the diff onto a new commit, so git
    // does not consider the branch merged and -d would refuse.
    console.log(`local  ${branch}: deleted`);
  }

  if (probe("git", ["ls-remote", "--exit-code", "--heads", "origin", branch]) === null) {
    console.log(`remote ${branch}: already gone`);
    return true;
  }

  if (probe("git", ["push", "origin", "--delete", branch]) === null) {
    // Not fatal: the release has already landed by now. A stale remote branch
    // is untidy, not broken.
    console.log(
      `remote ${branch}: DELETE FAILED — remove it by hand with: git push origin --delete ${branch}`,
    );
    return true;
  }

  console.log(`remote ${branch}: deleted`);
  return true;
}

const DOCS_DIR = "src/content/docs";
const MIRROR_LOCALE = "ja";

/** Every `.md`/`.mdx` under `dir`, relative to `base`. */
function pages(dir: string, base: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path, base);
    return /\.mdx?$/.test(entry.name) ? [relative(base, path)] : [];
  });
}

/**
 * Fail when an English page has no Japanese mirror, or the reverse.
 *
 * Starlight renders a missing `ja/` page as the English one with a "not
 * translated" notice, and `astro build` passes, so the build cannot catch it.
 */
function localeParity(): boolean {
  const mirrorRoot = join(DOCS_DIR, MIRROR_LOCALE);
  const en = new Set(
    pages(DOCS_DIR, DOCS_DIR).filter((page) => !page.startsWith(`${MIRROR_LOCALE}/`)),
  );
  const ja = new Set(pages(mirrorRoot, mirrorRoot));

  const missingJa = [...en].filter((page) => !ja.has(page)).sort();
  const missingEn = [...ja].filter((page) => !en.has(page)).sort();

  for (const page of missingJa) console.log(`missing ${MIRROR_LOCALE}: ${join(mirrorRoot, page)}`);
  for (const page of missingEn) console.log(`missing en: ${join(DOCS_DIR, page)}`);

  if (missingJa.length + missingEn.length > 0) {
    console.log("locale parity FAILED.");
    return false;
  }

  console.log(`locale parity ok: ${en.size} page(s) in both locales.`);
  return true;
}

function usage(): boolean {
  console.log("usage: release-guard.ts tag-guard      <pr-number>");
  console.log("       release-guard.ts push-guard     <branch>");
  console.log("       release-guard.ts body-check     <issue|pr|release> <id>");
  console.log("       release-guard.ts branch-cleanup <branch>");
  console.log("       release-guard.ts locale-parity");
  return false;
}

function main(): boolean {
  const [command, first, second] = process.argv.slice(2);

  if (command === "tag-guard" && first !== undefined && second === undefined)
    return tagGuard(first);
  if (command === "push-guard" && first !== undefined && second === undefined)
    return pushGuard(first);
  if (command === "body-check" && first !== undefined && second !== undefined)
    return bodyCheck(first, second);
  if (command === "branch-cleanup" && first !== undefined && second === undefined)
    return branchCleanup(first);
  if (command === "locale-parity" && first === undefined) return localeParity();

  return usage();
}

try {
  if (!main()) process.exitCode = 1;
} catch (error) {
  console.log(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
