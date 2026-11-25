// Flags hub pages that have fallen behind their source in oharu121/skills.
//
// Each entry in src/data/skills.ts records `syncedAt`: the skills commit its page was last
// checked against. A page is stale when the diff from `syncedAt` to main touches the entry's
// source path. After updating a stale page, set its `syncedAt` to the main SHA printed below.
//
// Usage: pnpm check:sync   (auth: GITHUB_TOKEN, GH_TOKEN, else `gh auth token`, else anonymous)
// Exit codes: 0 all in sync, 1 stale pages found, 2 lookup failed.

import { execFileSync } from 'node:child_process';
import { blobBase, repo, skills } from '../src/data/skills.ts';

type Commit = { sha: string; commit: { message: string } };
type Compare = { status: string; commits: Commit[]; files?: { filename: string }[] };

// Anonymous requests share a 60/h limit per IP, which runs out fast, so borrow gh's login.
function ghToken(): string | undefined {
	try {
		const out = execFileSync('gh', ['auth', 'token'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		});
		return out.trim() || undefined;
	} catch {
		return undefined;
	}
}
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? ghToken();

async function api<T>(path: string): Promise<T> {
	const res = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
		headers: {
			Accept: 'application/vnd.github+json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});
	if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${await res.text()}`);
	return res.json() as Promise<T>;
}

// One compare per distinct `syncedAt`: most entries share one, so this is usually one request.
// The combined diff's file list (capped at 300 files) decides staleness without a call per entry.
const compareCache = new Map<string, Promise<Compare>>();
function compareToMain(base: string): Promise<Compare> {
	if (!compareCache.has(base)) {
		compareCache.set(
			base,
			api<Compare>(`compare/${base}...main`).then((cmp) => {
				if (cmp.status === 'diverged' || cmp.status === 'behind') {
					throw new Error(`syncedAt ${base} is not an ancestor of main (${cmp.status})`);
				}
				return cmp;
			}),
		);
	}
	return compareCache.get(base)!;
}

async function main() {
	const entries = skills.map((entry) => {
		if (!entry.github.startsWith(blobBase)) {
			throw new Error(`${entry.slug}: github URL is not under ${blobBase}`);
		}
		return { entry, path: entry.github.slice(blobBase.length) };
	});

	const [head, results] = await Promise.all([
		api<Commit>('commits/main').then((c) => c.sha),
		Promise.all(
			entries.map(async ({ entry, path }) => {
				const cmp = await compareToMain(entry.syncedAt);
				const touched = (cmp.files ?? []).some(
					(f) => f.filename === path || f.filename.startsWith(`${path}/`),
				);
				if (!touched) return { entry, path, newer: [] as Commit[] };
				// Name the commits for a stale page: its path history, kept to those after syncedAt.
				const ahead = new Set(cmp.commits.map((c) => c.sha));
				const history = await api<Commit[]>(
					`commits?sha=main&path=${encodeURIComponent(path)}&per_page=100`,
				);
				return { entry, path, newer: history.filter((c) => ahead.has(c.sha)) };
			}),
		),
	]);

	for (const { entry, path, newer } of results) {
		console.log(`${newer.length ? 'STALE' : 'ok   '}  ${entry.slug}  (${path})`);
		for (const c of newer) {
			console.log(`         ${c.sha.slice(0, 7)} ${c.commit.message.split('\n')[0]}`);
		}
	}

	const staleCount = results.filter((r) => r.newer.length).length;
	console.log(`\n${repo} main is ${head}`);
	if (staleCount) {
		console.log(
			`${staleCount} page(s) behind. Update the EN and JA pages, then set their syncedAt to the SHA above.`,
		);
		process.exit(1);
	}
	console.log('All pages in sync.');
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(2);
});
